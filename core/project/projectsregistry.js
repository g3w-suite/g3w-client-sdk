import 'babel-polyfill';
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const Project = require('core/project/project');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');
const MapLayersStoresRegistry = require('core/map/maplayersstoresregistry');

/* service
    setup: init method
    getLayersState: returnLayersState
    getLayersTree: retunr  array of layersTree from LayersState
*/

// Public interface
function ProjectsRegistry() {
  this.config = null;
  this.initialized = false;
  this.projectType = null;
  this.setters = {
    setCurrentProject: function(project) {
      if (this.state.currentProject !== project) {
        CatalogLayersStoresRegistry.removeLayersStores();
        MapLayersStoresRegistry.removeLayersStores();
      }
      this.state.currentProject = project;
      this.state.qgis_version = project.getQgisVersion();
      this.setProjectType(project.state.type);
      const projectLayersStore = project.getLayersStore();
      //set in first position (catalog)
      CatalogLayersStoresRegistry.addLayersStore(projectLayersStore, 0);
      //set in first position (map)
      MapLayersStoresRegistry.addLayersStore(projectLayersStore, 0);
    }
  };

  this.state = {
    baseLayers: {},
    minScale: null,
    maxscale: null,
    currentProject: null,
    qgis_version: null
  };


  // (lazy loading)
  this._pendingProjects = [];
  this._projects = {};

  base(this);
}

inherit(ProjectsRegistry, G3WObject);

const proto = ProjectsRegistry.prototype;

proto.init = function(config) {
  const d = $.Deferred();
  //check if already initialized
  if (!this.initialized) {
    this.config = config;
    this.overviewproject = config.overviewproject;
    this.setupState();
    // get current configuration
    this.getProject(config.initproject)
    .then((project) => {
      // set current project
      this.setCurrentProject(project);
      this.initialized = true;
      d.resolve(project);
    })
    .fail(function() {
      d.reject();
    })
  }
  return d.promise();
};

proto.setProjectType = function(projectType) {
   this.projectType = projectType;
};

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
};

proto.setupState = function() {
  this.state.baseLayers = this.config.baselayers;
  this.state.minScale = this.config.minscale;
  this.state.maxScale = this.config.maxscale;
  this.state.crs = this.config.crs;
  this.state.proj4 = this.config.proj4;
  const overViewProject = (this.config.overviewproject && this.config.overviewproject.gid) ? this.config.overviewproject : null;
  this.config.projects.forEach((project) => {
    this.state.qgis_version = project.qgis_version || this.state.qgis_version;
    project.baselayers = _.cloneDeep(this.config.baselayers);
    project.minscale = this.config.minscale;
    project.maxscale = this.config.maxscale;
    project.crs = this.config.crs;
    project.proj4 = this.config.proj4;
    project.overviewprojectgid = overViewProject;
    this._pendingProjects.push(project);
  });
};

proto.getProjectType = function() {
  return this.projectType;
};

proto.getPendingProjects = function() {
  return this._pendingProjects;
};

proto.getProjects = function() {
  return this._pendingProjects;
};

proto.clearProjects = function() {
  this._pendingProjects = [];
};

proto.getListableProjects = function() {
  const currentProjectId = this.getCurrentProject().getId();
  return _.sortBy(this.getProjects().filter((project) => {
    if (!_.isNil(project.listable)) {
      return project.listable;
    }
    if (project.id === currentProjectId || (project.overviewprojectgid && project.gid === project.overviewprojectgid.gid)) {
      return false
    }
    return project;
  }), 'title')
};

proto.getCurrentProject = function() {
  return this.state.currentProject;
};

proto.getProject = function(projectGid) {
  const d = $.Deferred();
  let pendingProject;
  let project = null;
  this._pendingProjects.find((_pendingProject) => {
    if (_pendingProject.gid === projectGid) {
      pendingProject = _pendingProject;
      project = this._projects[projectGid];
      return true;
    }
  });
  if (!pendingProject) {
    d.reject("Project doesn't exist");
    return d.promise();
  }
  if (project) {
    d.resolve(project);
  } else {
    this._getProjectFullConfig(pendingProject)
      .then((projectFullConfig) => {
        const projectConfig = _.merge(pendingProject, projectFullConfig);
        projectConfig.WMSUrl = this.config.getWmsUrl(projectConfig);
        // setupu project relations
        projectConfig.relations = this._setProjectRelations(projectConfig);
        // instance of Project
        const project = new Project(projectConfig);
        // add to project
        this._projects[projectConfig.gid] = project;
        d.resolve(project);
      })
      .fail((error) => {
        d.reject(error);
      })
  }
  return d.promise();
};

proto._setProjectRelations = function(projectConfig) {
  projectConfig.relations = projectConfig.relations ? projectConfig.relations : [];
  projectConfig.relations = projectConfig.relations.map((relation) => {
    if (relation.type === "ONE") {
      projectConfig.layers.find((layer) => {
        if (layer.id === relation.referencingLayer) {
          relation.name = layer.name;
          return true;
        }
      })
    }
    return relation
  });
  return projectConfig.relations;
};

proto.getProjectConfigByGid = function(gid) {
  return this._pendingProjects.find((projectConfig) => {
    return projectConfig.gid == gid;
  })
};

// method to call server to get project configuration
proto._getProjectFullConfig = function(projectBaseConfig) {
  const d = $.Deferred();
  const url = this.config.getProjectConfigUrl(projectBaseConfig);
  $.get(url)
    .done((projectFullConfig) => {
      d.resolve(projectFullConfig);
    })
    .fail((error) => {
      d.reject(error);
    });
  return d.promise();
};


module.exports = new ProjectsRegistry();
