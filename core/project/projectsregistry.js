var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var reject = require('core/utils/utils').reject;
var G3WObject = require('core/g3wobject');
var Project = require('core/project/project');
var LayersStoresRegistry = require('core/layers/layersstoresregistry');

/* service
Funzione costruttore contentente tre proprieta':
    setup: metodo di inizializzazione
    getLayersState: ritorna l'oggetto LayersState
    getLayersTree: ritorna l'array layersTree dall'oggetto LayersState
*/

// Public interface
function ProjectsRegistry() {
  var self = this;
  this.config = null;
  this.initialized = false;
  //tipo di progetto
  this.projectType = null;
  this.setters = {
    setCurrentProject: function(project) {
      if (this.state.currentProject) {
        LayersStoresRegistry.removeLayersStore(this.state.currentProject.getLayersStore());
      }
      self.state.currentProject = project;
      //aggiunto tipo progetto
      self.setProjectType(project.state.type);
      // lo mette sempre in prima posizione mi serve per la mappa
      LayersStoresRegistry.addLayersStore(project.getLayersStore(), 0);
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

var proto = ProjectsRegistry.prototype;

proto.init = function(config) {
  var self = this;
  var deferred = $.Deferred();
  //verifico se è già stato inizilizzato
  if (!this.initialized) {
    this.initialized = true;
    //salva la configurazione
    this.config = config;
    // salvo l'overviewproject
    this.overviewproject = config.overviewproject;
    //setta lo state
    this.setupState();
    // vado a prendere la configurazione del progetto corrente
    this.getProject(config.initproject)
    .then(function(project) {
      // vado a settare il progetto corrente
      self.setCurrentProject(project);
      deferred.resolve(project);
    })
    .fail(function() {
      deferred.reject();
    })
  }
  return deferred.promise();
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
  var self = this;
  self.state.baseLayers = self.config.baselayers;
  self.state.minScale = self.config.minscale;
  self.state.maxScale = self.config.maxscale;
  self.state.crs = self.config.crs;
  self.state.proj4 = self.config.proj4;
  // setto  quale progetto deve essere impostato come overview
  //questo è settato da django-admin
  var overViewProject = (self.config.overviewproject && self.config.overviewproject.gid) ? self.config.overviewproject : null;
  //per ogni progetto ciclo e setto tutti gli attributi comuni
  // come i base layers etc ..
  self.config.projects.forEach(function(project) {
    project.baselayers = _.cloneDeep(self.config.baselayers);
    project.minscale = self.config.minscale;
    project.maxscale = self.config.maxscale;
    project.crs = self.config.crs;
    project.proj4 = self.config.proj4;
    project.overviewprojectgid = overViewProject;
    //aggiungo tutti i progetti ai pending project
    self._pendingProjects.push(project);
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
  var currentProjectId = this.getCurrentProject().getId();
  return _.filter(this.getProjects(), function(project) {
    if (!_.isNil(project.listable)) {
      return project.listable;
    }
    //resituisce solo quelli diversi da overviewprojetc
    // nel caso si stato settato
    if ((project.overviewprojectgid && project.gid != project.overviewprojectgid.gid && project.id != currentProjectId) || (project.id != currentProjectId)) {
      return project;
    }
  })
};

proto.getCurrentProject = function(){
  return this.state.currentProject;
};

// ottengo il progetto dal suo gid;
// ritorna una promise nel caso non fosse stato ancora scaricato
// il config completo (e quindi non sia ancora istanziato Project)
proto.getProject = function(projectGid) {
  var self = this;
  var d = $.Deferred();
  var pendingProject;
  var project = null;
  // scorro atraverso i pending project che contengono oggetti
  // di configurazione dei progetti del gruppo
  this._pendingProjects.forEach(function(_pendingProject) {
    if (_pendingProject.gid == projectGid) {
      pendingProject = _pendingProject;
      project = self._projects[projectGid];
    }
  });
  if (!pendingProject) {
    return reject("Project doesn't exist");
  }

  if (project) {
    return d.resolve(project);
  } else {
    return this._getProjectFullConfig(pendingProject)
    .then(function(projectFullConfig){
      var projectConfig = _.merge(pendingProject,projectFullConfig);
      projectConfig.WMSUrl = self.config.getWmsUrl(projectConfig);
      var project = new Project(projectConfig);
      // aggiungo/ registro il progetto
      self._projects[projectConfig.gid] = project;
      return d.resolve(project);
    })
    .fail(function() {
      return d.reject();
    })
  }
};
  
//ritorna una promises che verrà risolta con la
// configuarzione del progetto corrente
proto._getProjectFullConfig = function(projectBaseConfig) {
  var deferred = $.Deferred();
  var url = this.config.getProjectConfigUrl(projectBaseConfig);
  $.get(url)
    .done(function(projectFullConfig) {
      deferred.resolve(projectFullConfig);
    })
    .fail(function() {
      deferred.reject();
    });
  return deferred.promise();
};


module.exports = new ProjectsRegistry();
