const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const GUI = require('gui/gui');
const ProjectsRegistry = require('core/project/projectsregistry');
const PluginsRegistry = require('./pluginsregistry');

const Plugin = function() {
  base(this);
  this.name = '(no name)';
  this.config = null;
  this.service = null;
  this.dependencies = [];
  this._api = null;
  this._hook = null;
  this._ready;
  this._services = {
    'search': GUI.getComponent('search').getService(),
    'tools': GUI.getComponent('tools').getService()
  }
};

inherit(Plugin,G3WObject);

const proto = Plugin.prototype;

//API Plugin
proto.getApi = function() {
  return this._api;
};

proto.setApi = function(api) {
  this._api = api;
};

proto.setReady = function(bool) {
  this._ready = bool;
  this.emit('set-state', bool)
};

proto.isReady = function() {
  return new Promise((resolve, reject) => {
    if (this._ready !== undefined) {
      this._ready && resolve() || reject()
    } else {
      this.once('set-state', (bool) => {
        bool && resolve() || reject()
      })
    }
  })
};

//return plugin service
proto.getService = function() {
  return this.service
};

//set plugin service
proto.setService = function(service) {
  this.service = service;
};

proto.getName = function() {
  return this.name;
};

proto.setName = function(name) {
  this.name = name;
};

//get cplugin configuration
proto.getConfig = function(name) {
  name = name || this.name;
  return PluginsRegistry.getPluginConfig(name);
};

proto.setConfig = function(config) {
  this.config = config;
};

//check if plugin is compatible with current project
proto.isCurrentProjectCompatible = function(projectId) {
  const project = ProjectsRegistry.getCurrentProject();
  return projectId == project.getGid();
};

//register the plugin if compatible
proto.registerPlugin = function(projectId) {
  if (this.isCurrentProjectCompatible(projectId)) {
    PluginsRegistry.registerPlugin(this);
    return true;
  }
  return false;
};

proto.setupGui = function() {};

// method to get dependencies plugin
proto.getDependencyPlugins = function(pluginsName = []) {
  const pluginPromises = [];
  pluginsName.forEach((pluginName) => {
    pluginPromises.push(this.getDependencyPlugin(pluginName))
  });
  return Promise.all(pluginPromises)
};

// method to get plugin dependency
proto.getDependencyPlugin = function(pluginName) {
  return new Promise((resolve, reject) => {
    const plugin = PluginsRegistry.getPlugin(pluginName);
    if (plugin) {
      plugin.isReady().then(() => {
        resolve(plugin.getApi())
      })
    } else {
      PluginsRegistry.onafter('registerPlugin', (plugin) => {
        if (plugin.name === pluginName)
          plugin.isReady().then(() => {
            resolve(plugin.getApi())
          })
      })
    }
  })
};

proto.setHookLoading = function({hook="tools", loading=false} = {}) {
  const service = this._services[hook];
  service.setLoading(loading);
};

proto.getHookService = function(hook="tools") {
  return this._services[hook];
};

proto.addToolGroup = function({hook="tools", position:order, title:group} = {}) {
  const service = this.getHookService(hook);
  service.addToolGroup(order, group);
};

proto.addTools = function({hook="tools", action} = {}, options) {
  this._hook = hook;
  const service = this._services[hook];
  const configs = this.config.configs || [this.config];
  for (const config of configs) {
    service.addTools([{
      name: config.name,
      action: action.bind(this, config)
    }], options);
  }
};

proto.removeTools = function() {
  const service = this._services[this._hook];
  service.removeTools();
};

// unload (case change map)
proto.unload  = function() {
  //console.log('UNLOAD need to be overwrite by plugin');
};

// load plugin
proto.load = function() {
  //console.log('LOAD  need to be overwrite by plugin');
};

module.exports = Plugin;
