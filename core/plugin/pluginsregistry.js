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

  // funzione di inizializzazione dei plugin
  this.init = function(options) {
    var self = this;
    this.pluginsBaseUrl = options.pluginsBaseUrl;
    // oggetto contenente la configuarzione dei vvari plugins (che sono le chiavi dell'oggetto)
    this.pluginsConfigs = options.pluginsConfigs;
    // configurazione altri plugin
    this.otherPluginsConfig = options.otherPluginsConfig;
    this.setOtherPlugins();
        //ciclo sull'oggetto plugins per fare il setup dei vari plugin legati al progetto
    _.forEach(this.pluginsConfigs, function(pluginConfig, name) {
      self._setup(name, pluginConfig);
    })
  };

  this.setOtherPlugins = function() {
    //da vedere poi come cutomizzare il law plugin
    if (this.otherPluginsConfig && this.otherPluginsConfig.law && this.otherPluginsConfig.law.length) {
      this.pluginsConfigs['law'] =  this.otherPluginsConfig.law;
    }
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
        // devo ricaricare quelli con custom
        self.setOtherPlugins();
        // prendo dal documento tutti gli scripts
        var scripts = $('script');
        // va do a scorrere sui plugin registrati e verifico se il plugin esisteva oppure  no
        // se non esiste devo chiamare il metodo unload per sganciare tutte le sue cose (se previsto)
        // e implementato dal plugin
        _.forEach(self.getPlugins(), function(plugin, pluginName) {
          // verifico che il plugin non sia presente nella nuoav configurazione dei plugin
          //e quindi chieamo l'unload (se implementato) del plugin prima di
          // rimuovere lo script
          if (_.keys(self.pluginsConfigs).indexOf(pluginName) == -1) {
            // chaimo il metodo unload del plugin
            plugin.unload();
            // rimuovo il plugin anche dai pugin registrati
            delete self._plugins[pluginName];
            // cliclo sugli script vado a togliere gli script che contengono plugin
            _.forEach(scripts, function(scr) {
              _.forEach(self._loadedPluginUrls, function(pluginUrl, idx) {
                if (scr.getAttribute('src') == pluginUrl && pluginUrl.indexOf(pluginName) != -1) {
                  scr.parentNode.removeChild( scr );
                  //vado a cancellare lo script associato a quel plugin
                  self._loadedPluginUrls.splice(idx, 1);
                  return false;
                }
              })
            });
          } else {
            plugin.load();
            // lo devo togliere dalla configurazione
            delete self.pluginsConfigs[pluginName];
          }
        });
        _.forEach(self.pluginsConfigs, function(pluginConfig, pluginName) {
          self._setup(pluginName, pluginConfig);
        })
      });
  };

  this.setPluginsConfig = function(config) {
    this.pluginsConfigs = config;
  };

  //funzione che permette il caricamento dello script del plugin
  this._setup = function(name, pluginConfig) {
    // verifico che il plugin config la configurazione del
    // plugin non sia nulla per caricare il plugin
    if (!_.isNull(pluginConfig)) {
      var url = this.pluginsBaseUrl+name+'/js/plugin.js?'+Date.now();
      $script(url);
      // vado ad aggiunguere il plugin all'array dei plugin caricati
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
