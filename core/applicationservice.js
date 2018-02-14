const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ApiService = require('core/apiservice');
const RouterService = require('core/router');
const ProjectsRegistry = require('core/project/projectsregistry');
const PluginsRegistry = require('core/plugin/pluginsregistry');
const ClipboardService = require('core/clipboardservice');

const G3W_VERSION = "{G3W_VERSION}";

//Manage Application
const ApplicationService = function() {
  this.version = G3W_VERSION.indexOf("G3W_VERSION") == -1 ? G3W_VERSION  : "";
  this.secret = "### G3W Client Application Service ###";
  this.ready = false;
  this.complete = false;
  this._acquirePostBoostrap = false;
  // store all services sidebar etc..
  this._applicationServices = {};
  this.config = {};
  this._initConfigUrl = null;
  this._initConfig = {};
  base(this);
  // init from server
  this.init = function(config, acquirePostBoostrap) {
    this._config = config;
    if (acquirePostBoostrap) {
      this._acquirePostBoostrap = true;
    }
    // run bbotstrap
    return this._bootstrap();
  };
  // get config
  this.getConfig = function() {
    return this._config;
  };
  // router service
  this.getRouterService = function() {
    return RouterService;
  };
  // clipboard service
  this.getClipboardService = function() {
    return ClipboardService;
  };

  this.obtainInitConfig = function(initConfigUrl) {
    if (!this._initConfigUrl) {
      this._initConfigUrl = initConfigUrl;
    }
    const d = $.Deferred();
    // if exist a global initiConfig (in production)

    if (window.initConfig) {
      this._initConfig = window.initConfig;
      return d.resolve(window.initConfig);
    }
    // case development need to ask to api
    else {
      let projectPath;
      let queryTuples;
      if (location.search) {
        queryTuples = location.search.substring(1).split('&');
        queryTuples.forEach((queryTuple) => {
          //check if exist project in url
          if(queryTuple.indexOf("project") > -1) {
            projectPath = queryTuple.split("=")[1];
          }
        });
      } else {
        // when relaod
        projectPath = location.pathname.split('/').splice(-4,3).join('/');
      }
      if (projectPath) {
        let initUrl = this._initConfigUrl;
        if (projectPath) {
          initUrl = initUrl + '/' + projectPath;
        }
        //get configuration from server
        $.get(initUrl)
          .then((initConfig) => {
            //initConfig conatin mai configuration
            //group, mediaurl, staticurl, user
            initConfig.staticurl = "../dist/"; // in development force  asset
            initConfig.clienturl = "../dist/"; // in development force  asset
            this._initConfig = initConfig;
            // set initConfig
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

  // post boostratp
  this.postBootstrap = function() {
    if (!this.complete) {
      RouterService.init();
      // once the projects are inizilized and also api service
      // register  plugins
      this._bootstrapPlugins();
      this.complete = true;
    }
  };

  //boostrap plugins
  this._bootstrapPlugins = function() {
    return PluginsRegistry.init({
      pluginsBaseUrl: this._config.urls.staticurl,
      pluginsConfigs: this._config.plugins,
      otherPluginsConfig: ProjectsRegistry.getCurrentProject().getState()
    });
  };

  //  bootstrap (when called init)
  this._bootstrap = function() {
    const d = $.Deferred();
    //first time l'application service is not ready
    if (!this.ready) {
      $.when(
        // register project
        ProjectsRegistry.init(this._config),
        // inizialize api service
        ApiService.init(this._config)
      ).then(() => {
        this.emit('ready');
        // emit  ready
        if (!this._acquirePostBoostrap) {
          this.postBootstrap();
        }
        this.initialized = true;
        d.resolve();
      }).fail((error) => {
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
