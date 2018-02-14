const base = require('core/utils/utils').base;
const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');
const GUI = require('gui/gui');

function PluginsRegistry() {
  this.config = null;
  this._plugins = {};
  this._loadedPluginUrls = [];
  this.setters = {
    //setters to register plugin
    registerPlugin: function(plugin) {
      if (!this._plugins[plugin.name]) {
        this._plugins[plugin.name] = plugin;
      }
    }
  };
  base(this);

  // initilize plugin
  this.init = function(options) {
    const d = $.Deferred();
    this.pluginsBaseUrl = options.pluginsBaseUrl;
    // plugin configurations
    this.pluginsConfigs = options.pluginsConfigs;
    // cother plugins that aren't in configuration server
    this.otherPluginsConfig = options.otherPluginsConfig;
    this.setOtherPlugins();
    Object.entries(this.pluginsConfigs).forEach(([name, pluginConfig]) => {
      this._setup(name, pluginConfig);
    });

    return d.promise();
  };

  this.setOtherPlugins = function() {
    if (this.otherPluginsConfig && this.otherPluginsConfig.law && this.otherPluginsConfig.law.length) {
      // law plugin
      this.pluginsConfigs['law'] =  this.otherPluginsConfig.law;
    }
  };

  // reaload plugin in case of change map
  this.reloadPlugins = function(project) {
    const ApplicationService = require('core/applicationservice');
    // set initCongi to null to force to get new init configuration from server
    window.initConfig = null;
    //get new initConfig from server
    ApplicationService.obtainInitConfig()
      .then((initConfig) => {
        //remove tools
        GUI.getComponent('tools').getService().removeTools();
        this.setPluginsConfig(initConfig.group.plugins);
        this.setOtherPlugins();
        const scripts = $('script');
        Object.entries(this.getPlugins()).forEach(([pluginName, plugin]) => {
          if (_.keys(this.pluginsConfigs).indexOf(pluginName) == -1) {
            plugin.unload();
            delete this._plugins[pluginName];
            scripts.forEach((scr) => {
              this._loadedPluginUrls.forEach((pluginUrl, idx) => {
                if (scr.getAttribute('src') == pluginUrl && pluginUrl.indexOf(pluginName) != -1) {
                  scr.parentNode.removeChild( scr );
                  this._loadedPluginUrls.splice(idx, 1);
                  return false;
                }
              })
            });
          } else {
            plugin.load();
            delete this.pluginsConfigs[pluginName];
          }
        });
        Object.entries(this.pluginsConfigs).forEach(([pluginName, pluginConfig]) => {
          this._setup(pluginName, pluginConfig);
        })
      });
  };

  this.setPluginsConfig = function(config) {
    this.pluginsConfigs = config;
  };

  //load plugin script
  this._setup = function(name, pluginConfig) {

    if (!_.isNull(pluginConfig)) {
      const baseUrl = this.pluginsBaseUrl+name;
      const scriptUrl = baseUrl + '/js/plugin.js?'+Date.now();
      const url = this.pluginsBaseUrl+name+'/js/plugin.js?'+Date.now();
      pluginConfig.baseUrl= this.pluginsBaseUrl;
      $script(scriptUrl);
      this._loadedPluginUrls.push(url);
    }
  };

  this.getPluginConfig = function(pluginName) {
    return this.pluginsConfigs[pluginName];
  };

  this.getPlugins = function() {
    return this._plugins;
  };

  this.getPlugin = function(pluginName) {
    return this._plugins[pluginName];
  }

}

inherit(PluginsRegistry,G3WObject);

module.exports = new PluginsRegistry;
