var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ApiService = require('core/apiservice');
var RouterService = require('core/router');
var ProjectsRegistry = require('core/project/projectsregistry');
var PluginsRegistry = require('core/plugin/pluginsregistry');
var ClipboardService = require('core/clipboardservice');

//oggetto servizio per la gestione dell'applicazione
var ApplicationService = function() {
  var self = this;
  this.secret = "### G3W Client Application Service ###";
  this.ready = false;
  this.complete = false;
  this._modalOverlay = null;
  this._acquirePostBoostrap = false;
  // oggetto che tiene tutti i servizi dei vari sidebar etc..
  // utili per il plugin
  this._applicationServices = {};
  this.config = {};
  // chiama il costruttore di G3WObject (che in questo momento non fa niente)
  base(this);
  // funzione inizializzazione che prende la configurazione dal server
  this.init = function(config, acquirePostBoostrap){
    this._config = config;
    if (acquirePostBoostrap) {
      this._acquirePostBoostrap = true;
    }
    // lancio il bootstrap dell'applicazione
    this._bootstrap();
  };
  // restituisce la configurazione
  this.getConfig = function() {
    return this._config;
  };
  // restituisce il router service
  this.getRouterService = function() {
    return RouterService;
  };
  // clipboard service
  this.getClipboardService = function() {
    return ClipboardService;
  };
  // funzione post boostratp
  this.postBootstrap = function() {

    if (!this.complete) {
      RouterService.init();
      var currentProject = ProjectsRegistry.getCurrentProject();
      if (currentProject.state.law && currentProject.state.law.length) {
        self._config.plugins['law'] =  currentProject.state.law;
      }
      // una volta inizializzati i progetti e l'api service
      // registra i plugins passando gli static urls e l'oggetto plugins
      PluginsRegistry.init({
        pluginsBaseUrl: self._config.urls.staticurl,
        pluginsConfigs: self._config.plugins
      });
      this.complete = true;
    }
  };
  // funzione bootstrap (quando viene chiamato l'init)
  this._bootstrap = function(){
    var self = this;
    //nel caso in cui (prima volta) l'application service non è pronta
    //faccio una serie di cose
    if (!this.ready) {
      // Inizializza la configurazione dei servizi.
      // Ognungo cercherà dal config quello di cui avrà bisogno
      // una volta finita la configurazione emetto l'evento ready.
      // A questo punto potrò avviare l'istanza Vue globale
      $.when(
        // inizializza api service
        ApiService.init(this._config),
        // registra i progetti
        ProjectsRegistry.init(this._config)
      ).then(function() {
        // emetto l'evento ready
        self.emit('ready');
        if (!self._acquirePostBoostrap) {
          self.postBootstrap();
        }
        this.initialized = true;
      });
    }
  };

  this.registerService = function(element, service) {
    this._applicationServices[element] = service;
  };

  this.unregisterService = function(element) {
    delete this._applicationServices[element];
  };

  this.getService = function(element) {
    return this._applicationServices[element];
  }

};

inherit(ApplicationService,G3WObject);

module.exports = new ApplicationService;
