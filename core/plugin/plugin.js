const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ProjectsRegistry = require('core/project/projectsregistry');
const PluginsRegistry = require('./pluginsregistry');

const Plugin = function() {

  base(this);
  this.name = '(no name)';
  this.config = null;
  this.service = null;
};

inherit(Plugin,G3WObject);

const proto = Plugin.prototype;

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

// unload (case change map)
proto.unload  = function() {
  //console.log('UNLOAD need to be overwrite by plugin');
};

// load plugin
proto.load = function() {
  //console.log('LOAD  need to be overwrite by plugin');
};

module.exports = Plugin;
