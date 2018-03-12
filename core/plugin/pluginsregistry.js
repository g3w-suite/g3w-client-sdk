const base = require('core/utils/utils').base;
const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');

function PluginsRegistry() {
  this.config = null;
  this._plugins = {};
  this.pluginsConfigs = {};
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
    // plugins that aren't in configuration server but in project
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
      this.pluginsConfigs['law'] = this.otherPluginsConfig.law;
      this.pluginsConfigs['law'].gid = this.otherPluginsConfig.gid;
    } else {
      delete this.pluginsConfigs['law'];
    }
  };

  // reaload plugin in case of change map
  this.reloadPlugins = function(initConfig, project) {
    //setup plugins
    this.otherPluginsConfig = project.getState();
    this.setPluginsConfig(initConfig.group.plugins);
    this.setOtherPlugins();
    //get all script through jquery
    const scripts = $('script');
    Object.entries(this.getPlugins()).forEach(([pluginName, plugin]) => {
      if (_.keys(this.pluginsConfigs).indexOf(pluginName) == -1) {
        // unload plugin e remove from DOM
        plugin.unload();
        delete this._plugins[pluginName];
        scripts.each((index, scr) => {
          this._loadedPluginUrls.forEach((pluginUrl, idx) => {
            if (scr.getAttribute('src') == pluginUrl && pluginUrl.indexOf(pluginName) != -1) {
              scr.parentNode.removeChild( scr );
              this._loadedPluginUrls.splice(idx, 1);
              return false;
              }})
        });
      } else {
        // load a plugin again
        plugin.load();
        delete this.pluginsConfigs[pluginName];
      }
    });
    Object.entries(this.pluginsConfigs).forEach(([pluginName, pluginConfig]) => {
      this._setup(pluginName, pluginConfig);
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
