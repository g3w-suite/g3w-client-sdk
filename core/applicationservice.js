const inherit = require('core/utils/utils').inherit;
const XHR = require('core/utils/utils').XHR;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ApiService = require('core/apiservice');
const RouterService = require('core/router');
const ProjectsRegistry = require('core/project/projectsregistry');
const PluginsRegistry = require('core/plugin/pluginsregistry');
const ClipboardService = require('core/clipboardservice');
const GlobalComponents = require('gui/vue/vue.globalcomponents');
const GlobalDirective = require('gui/vue/vue.directives');
const GUI = require('gui/gui');
const G3W_VERSION = "{G3W_VERSION}";
// install global components
Vue.use(GlobalComponents);
// install gloabl directive
Vue.use(GlobalDirective);

//Manage Application
const ApplicationService = function() {
  let production = false;
  this.version = G3W_VERSION.indexOf("G3W_VERSION") === -1 ? G3W_VERSION  : "";
  this.ready = false;
  this.iframe = window.top !== window.self;
  this.complete = false;
  // store all services sidebar etc..
  this._applicationServices = {};
  this.config = {};
  this._initConfigUrl = null;
  this._initConfig = {};
  this._groupId = null;
  this._gid = null;
  this.setters = {
    changeProject({gid}={}){
      return this._changeProject({gid})
    }
  };
  base(this);
  // init from server
  this.init = function(config={}) {
    this._config = config;
    this._groupId = this._config.group.name.replace(/\s+/g, '-').toLowerCase();
    // run bbotstrap
    return this._bootstrap();
  };

  //check if is in Iframe
  this.isIframe = function() {
    return this.iframe;
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

  this.obtainInitConfig = function(initConfigUrl, url) {
    const d = $.Deferred();
    const currentProject = ProjectsRegistry.getCurrentProject();
    const aliasUrl =  currentProject && currentProject.getAliasUrl();
    if (!this._initConfigUrl) this._initConfigUrl = initConfigUrl;
    else this.clearInitConfig();
    // if exist a global initiConfig (in production)
    if (window.initConfig) {
      production = true;
      this._initConfig = window.initConfig;
      return d.resolve(window.initConfig);
      // case development need to ask to api
    } else {
      let projectPath;
      let queryTuples;
      const locationsearch = url ? url.split('?')[1] : location.search ? location.search.substring(1) : null;
      if (locationsearch) {
        queryTuples = locationsearch.split('&');
        queryTuples.forEach((queryTuple) => {
          //check if exist project in url
          if( queryTuple.indexOf("project") > -1) {
            projectPath = queryTuple.split("=")[1];
          }
        });
      } else {
        if (!aliasUrl) projectPath = location.pathname.split('/').splice(-4,3).join('/');
        else {
          const type_id = this._gid.split(':').join('/');
          projectPath = `${this._groupId}/${type_id}`;
        }
      }
      if (projectPath) {
        const initUrl =  `/${this._initConfigUrl}/${projectPath}`;
        // get configuration from server (return a promise)
        XHR.get({
          url: initUrl
        }).then((initConfig) => {
          //initConfig conatin mai configuration
          //group, mediaurl, staticurl, user
          initConfig.staticurl = "../dist/"; // in development force  asset
          initConfig.clienturl = "../dist/"; // in development force  asset
          this._initConfig = initConfig;
          // set initConfig
          window.initConfig = initConfig;
          d.resolve(initConfig);
        }).catch((error) => {
          d.reject(error);
        });
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
  this.postBootstrap = async function() {
    if (!this.complete) {
      try {
        RouterService.init();
        // once the projects are inizilized and also api service
        // register  plugins
        await this._bootstrapPlugins()
      } catch(err) {
      } finally {
        this.complete = true;
        this.emit('complete');
      }
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
      // LOAD DEVELOPMENT CONFIGURATION
      if (!production) require('../config/dev/index');
      $.when(
        // register project
        ProjectsRegistry.init(this._config),
        // inizialize api service
        ApiService.init(this._config)
      ).then(() => {
        this.emit('ready');
        this.ready = this.initialized = true;
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
  };

  this.clearInitConfig = function() {
    window.initConfig = null;
  };

  this._changeProject = function({gid}={}) {
    const d = $.Deferred();
    this._gid = gid;
    const aliasUrl = ProjectsRegistry.getProjectAliasUrl(gid);
    const mapUrl = ProjectsRegistry.getProjectUrl(gid);
    // change url using history
    if (production && aliasUrl) history.replaceState(null, null, aliasUrl);
    else history.replaceState(null, null, mapUrl);
    //remove tools
    this.obtainInitConfig()
      .then((initConfig) => {
        ProjectsRegistry.getProject(gid)
          .then((project) => {
            GUI.closeUserMessage();
            GUI.closeContent()
              .then(() => {
                // change current project project
                ProjectsRegistry.setCurrentProject(project);
                // remove all toos
                GUI.getComponent('tools').getService().reload();
                // reload metadati
                GUI.getComponent('metadata').getService().reload();
                // reload plugins
                PluginsRegistry.reloadPlugins(initConfig, project)
                  .then(()=>{})
                  .catch(()=>{})
                  .finally(()=> {
                  // reload components
                  GUI.reloadComponents();
                  d.resolve(project);
                })

              })
              .fail((err) => {
                console.log(err);
              })
          })
          .fail(() => {
            d.reject();
          });
      })
      .fail((err) => {
        //TODO
      });
    return d.promise();
  }
};

inherit(ApplicationService,G3WObject);


module.exports = new ApplicationService;
