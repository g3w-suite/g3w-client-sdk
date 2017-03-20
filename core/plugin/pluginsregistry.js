var base = require('core/utils/utils').base;
var inherit = require('core/utils/utils').inherit;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');

function PluginsRegistry() {
  var self = this;
  this.config = null;
  // un domani questo sarà dinamico
  this._plugins = {};
  this._loadedPluginUrls = [];
  this.setters = {
    //setters che server per registrare il plugin
    registerPlugin: function(plugin) {
      if (!self._plugins[plugin.name]) {
        self._plugins[plugin.name] = plugin;
      }
    }
  };

  base(this);

  this.init = function(options) {
    var self = this;
    this.pluginsBaseUrl = options.pluginsBaseUrl;
    this.pluginsConfigs = options.pluginsConfigs;
    this.otherPluginsConfig = options.otherPluginsConfig;
    //da vedere poi come cutomizzare il law plugin
    if (this.otherPluginsConfig && this.otherPluginsConfig.law && this.otherPluginsConfig.law.length) {
      this.pluginsConfigs['law'] =  this.otherPluginsConfig.law;
    }
    //ciclo sull'oggetto plugins per fare il setup dei vari plugin legati al progetto
    _.forEach(this.pluginsConfigs, function(pluginConfig, name) {
      self._setup(name, pluginConfig);
    })
  };

  // funzione che serve per fare il reload dei plugins
  this.reloadPlugins = function(project) {
    var self = this;
    var ApplicationService = require('core/applicationservice');
    //forzo la varibile globale initConfig a null affinche venga ricaricato
    // la configurazione iniziale
    window.initConfig = null;
    //vado a riottenere l'initConfig
    ApplicationService.obtainInitConfig()
      .then(function(initConfig) {
        // prendo vado a rimuovere i tools
        GUI.getComponent('tools').getService().removeTools();
        // setto il pluginsConfig
        self.setPluginsConfig(initConfig.group.plugins);
        // cliclo sugli scripte vado a togliere gli script che contengono plugin
        _.forEach($('script'), function(scr) {
          _.forEach(self._loadedPluginUrls, function(pluginUrl) {
            if (scr.getAttribute('src') == pluginUrl) {
              scr.parentNode.removeChild( scr );
              return false;
            }
          })
        });
        //vado a cancellare a risettare a vuoto l'array degli url
        self._loadedPluginUrls = [];
        // vado a ricarcicare i plugin
        _.forEach(self.pluginsConfigs, function(pluginConfig, pluginName) {
          self._setup(pluginName, pluginConfig);
        })
      });
  };

  this.setPluginsConfig = function(config) {
    this.pluginsConfigs = config;
  };

  this._setup = function(name, pluginConfig) {
    if (pluginConfig) {
      var url = this.pluginsBaseUrl+name+'/js/plugin.js?'+Date.now();
      $script(url);
      this._loadedPluginUrls.push(url);
    }
  };
  
  this.getPluginConfig = function(pluginName) {
    return this.pluginsConfigs[pluginName];
  };

}

inherit(PluginsRegistry,G3WObject);

module.exports = new PluginsRegistry;
