const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const reject = require('core/utils/utils').reject;
const G3WObject = require('core/g3wobject');
const Project = require('core/project/project');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');
const MapLayersStoresRegistry = require('core/map/maplayersstoresregistry');

/* service
Funzione costruttore contentente tre proprieta':
    setup: metodo di inizializzazione
    getLayersState: ritorna l'oggetto LayersState
    getLayersTree: ritorna l'array layersTree dall'oggetto LayersState
*/

// Public interface
function ProjectsRegistry() {
  this.config = null;
  this.initialized = false;
  //tipo di progetto
  this.projectType = null;
  this.setters = {
    setCurrentProject: function(project) {
      if (this.state.currentProject) {
        CatalogLayersStoresRegistry.removeLayersStores();
        MapLayersStoresRegistry.removeLayersStores();
      }
      this.state.currentProject = project;
      //aggiunto tipo progetto
      this.setProjectType(project.state.type);
      const projectLayersStore = project.getLayersStore();
      // lo mette sempre in prima posizione mi serve per il catalogo
      CatalogLayersStoresRegistry.addLayersStore(projectLayersStore, 0);
      // lo mette sempre in prima posizione mi serve per la mappa
      MapLayersStoresRegistry.addLayersStore(projectLayersStore, 0);
    }
  };
  //stato del registro progetti
  this.state = {
    baseLayers: {},
    minScale: null,
    maxscale: null,
    currentProject: null
  };

  // tutte le configurazioni di base dei progetti, ma di cui non è detto che
  // sia ancora disponibile l'istanza (lazy loading)
  this._pendingProjects = [];
  this._projects = {};

  base(this);
}

inherit(ProjectsRegistry, G3WObject);

const proto = ProjectsRegistry.prototype;

proto.init = function(config) {
  const d = $.Deferred();
  //verifico se è già stato inizilizzato
  if (!this.initialized) {
    //salva la configurazione
    this.config = config;
    // salvo l'overviewproject
    this.overviewproject = config.overviewproject;
    //setta lo state
    this.setupState();
    // vado a prendere la configurazione del progetto corrente
    this.getProject(config.initproject)
    .then((project) => {
      // vado a settare il progetto corrente
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
  // setto  quale progetto deve essere impostato come overview
  //questo è settato da django-admin
  const overViewProject = (this.config.overviewproject && this.config.overviewproject.gid) ? this.config.overviewproject : null;
  //per ogni progetto ciclo e setto tutti gli attributi comuni
  // come i base layers etc ..
  this.config.projects.forEach((project) => {
    project.baselayers = _.cloneDeep(this.config.baselayers);
    project.minscale = this.config.minscale;
    project.maxscale = this.config.maxscale;
    project.crs = this.config.crs;
    project.proj4 = this.config.proj4;
    project.overviewprojectgid = overViewProject;
    //aggiungo tutti i progetti ai pending project
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

proto.getListableProjects = function() {
  const currentProjectId = this.getCurrentProject().getId();
  return _.sortBy(_.filter(this.getProjects(), (project) => {
    if (!_.isNil(project.listable)) {
      return project.listable;
    }
    //resituisce solo quelli diversi da overviewprojetc
    // nel caso si stato settato
    if ((project.id != currentProjectId) && (project.overviewprojectgid && project.gid != project.overviewprojectgid.gid && project.id != currentProjectId)) {
      return project;
    }
  }), 'title')
};

//recupera il progetto corrente
proto.getCurrentProject = function(){
  return this.state.currentProject;
};

// ottengo il progetto dal suo gid;
// ritorna una promise nel caso non fosse stato ancora scaricato
// il config completo (e quindi non sia ancora istanziato Project)
proto.getProject = function(projectGid) {
  const d = $.Deferred();
  let pendingProject;
  let project = null;
  // scorro atraverso i pending project che contengono oggetti
  // di configurazione dei progetti del gruppo
  this._pendingProjects.forEach((_pendingProject) => {
    if (_pendingProject.gid == projectGid) {
      pendingProject = _pendingProject;
      project = this._projects[projectGid];
    }
  });
  if (!pendingProject) {
    return reject("Project doesn't exist");
  }

  if (project) {
    return d.resolve(project);
  } else {
    return this._getProjectFullConfig(pendingProject)
    .then((projectFullConfig) => {
      const projectConfig = _.merge(pendingProject,projectFullConfig);
      projectConfig.WMSUrl = this.config.getWmsUrl(projectConfig);
      const project = new Project(projectConfig);
      // aggiungo/ registro il progetto
      this._projects[projectConfig.gid] = project;
      return d.resolve(project);
    })
    .fail(() => {
      return d.reject();
    })
  }
};

//ritorna una promises che verrà risolta con la
// configuarzione del progetto corrente
proto._getProjectFullConfig = function(projectBaseConfig) {
  const d = $.Deferred();
  const url = this.config.getProjectConfigUrl(projectBaseConfig);
  $.get(url)
    .done((projectFullConfig) => {
      d.resolve(projectFullConfig);
    })
    .fail(() => {
      d.reject();
    });
  return d.promise();
};


module.exports = new ProjectsRegistry();
