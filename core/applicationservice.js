var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ApiService = require('core/apiservice');
var RouterService = require('core/router');
var ProjectsRegistry = require('core/project/projectsregistry');
var PluginsRegistry = require('core/plugin/pluginsregistry');
var ClipboardService = require('core/clipboardservice');

var G3W_VERSION = "{G3W_VERSION}";

//oggetto servizio per la gestione dell'applicazione
var ApplicationService = function() {
  var self = this;
  this.version = G3W_VERSION.indexOf("G3W_VERSION") == -1 ? G3W_VERSION  : "";
  this.secret = "### G3W Client Application Service ###";
  this.ready = false;
  this.complete = false;
  this._acquirePostBoostrap = false;
  // oggetto che tiene tutti i servizi dei vari sidebar etc..
  // utili per il plugin
  this._applicationServices = {};
  this.config = {};
  this._initConfigUrl = null;
  this._initConfig = {};
  // chiama il costruttore di G3WObject (che in questo momento non fa niente)
  base(this);
  // funzione inizializzazione che prende la configurazione dal server
  this.init = function(config, acquirePostBoostrap) {
    this._config = config;
    if (acquirePostBoostrap) {
      this._acquirePostBoostrap = true;
    }
    // lancio il bootstrap dell'applicazione
    return this._bootstrap();
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

  // funzione che ottiene la configurazione dal server
  this.obtainInitConfig = function(initConfigUrl) {
    var self = this;
    if (!this._initConfigUrl) {
      this._initConfigUrl = initConfigUrl;
    }
    var d = $.Deferred();
    //se esiste un oggetto globale initiConfig che vuol dire che sto facendo girare il client in produzione
    // in quanto django fronisce la variabile globale initConfig  e vad a risolvere con quell'oggetto
    if (window.initConfig) {
      this._initConfig = window.initConfig;
      return d.resolve(window.initConfig);
    }
    // altrimenti se sono in ambiente development devo fare richiesta 
    // al server usando initconfigUrl e i parametri fornito dal percorso indicato in ?project=<percorso>
    else {
      var projectPath;
      var queryTuples;
      if (location.search) {
        queryTuples = location.search.substring(1).split('&');
        _.forEach(queryTuples, function (queryTuple) {
          //se esiste la parola project nel url
          if(queryTuple.indexOf("project") > -1) {
            //prendo il valore del path progetto (nomeprogetto/tipoprogetto/idprogetto)
            //esempio comune-di-capannori/qdjango/22/
            projectPath = queryTuple.split("=")[1];
          }
        });
      } else {
        // prevista per il reload in fase di admin
        projectPath = location.pathname.split('/').splice(-4,3).join('/');
      }
      if (projectPath) {
        var initUrl = this._initConfigUrl;
        if (projectPath) {
          initUrl = initUrl + '/' + projectPath;
        }
        //recupro dal server la configurazione di quel progetto
        $.get(initUrl)
          .then(function(initConfig) {
            //initConfig è l'oggetto contenete:
            //group, mediaurl, staticurl, user
            initConfig.staticurl = "../dist/"; // in locale forziamo il path degli asset
            initConfig.clienturl = "../dist/"; // in locale forziamo il path degli asset
            self._initConfig = initConfig;
            // setto la variabile initConfig
            window.initConfig = initConfig;
            d.resolve(initConfig);
          })
          .fail(function(error) {
            d.reject(error);
          })
      }
    }
    return d.promise();
  };

  this.getInitConfig = function() {
    return this._initConfig;
  };

  this.getInitConfigUrl = function() {
    return this._initConfigUrl;
  };

  this.setInitConfigUrl = function(initConfigUrl) {
    this._initConfigUrl = initConfigUrl;
  };

  // funzione post boostratp
  this.postBootstrap = function() {
    if (!this.complete) {
      RouterService.init();
      // una volta inizializzati i progetti e l'api service
      // registra i plugins passando gli static urls e l'oggetto plugins
      PluginsRegistry.init({
        pluginsBaseUrl: self._config.urls.staticurl,
        pluginsConfigs: self._config.plugins,
        otherPluginsConfig: ProjectsRegistry.getCurrentProject().getState()
      });
      this.complete = true;
    }
  };

  // funzione bootstrap (quando viene chiamato l'init)
  this._bootstrap = function() {
    var self = this;
    var d = $.Deferred();
    //nel caso in cui (prima volta) l'application service non è pronta
    //faccio una serie di cose
    if (!this.ready) {
      // Inizializza la configurazione dei servizi.
      // Ognungo cercherà dal config quello di cui avrà bisogno
      // una volta finita la configurazione emetto l'evento ready.
      // A questo punto potrò avviare l'istanza Vue globale
      $.when(
        // registra i progetti
        ProjectsRegistry.init(this._config),
        // inizializza api service
        ApiService.init(this._config)
      ).then(function() {
        // emetto l'evento ready
        self.emit('ready');
        if (!self._acquirePostBoostrap) {
          self.postBootstrap();
        }
        this.initialized = true;
        d.resolve();
      }).fail(function(error) {
        d.reject(error);
      })
    }
    return d.promise();
  };

  this.registerService = function(element, service) {
    this._applicationServices[element] = service;
  };

  this.unregisterService = function(element) {
    delete this._applicationServices[element];
  };

  this.getService = function(element) {
    return this._applicationServices[element];
  };

  this.errorHandler = function(error) {
    console.log(error);
  }

};

inherit(ApplicationService,G3WObject);


module.exports = new ApplicationService;
