const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const ProjectsRegistry = require('core/project/projectsregistry');
const G3WObject = require('core/g3wobject');
const SearchService = require('./vue/panel/searchservice');

function Service() {
  const currentProjectState = ProjectsRegistry.getCurrentProject().state;
  this.title = currentProjectState.search_title || "search";
  this.init = function (searchesObject) {
    const searches = searchesObject || currentProjectState.search;
    this.state.searches = searches;
  };
  this.state = {
    searches: [],
    searchtools: []
  };
}

inherit(Service, G3WObject);

const proto = Service.prototype;

proto.getTitle = function() {
  return this.title;
};

proto.getLayerById = function(layerId) {
  return ProjectsRegistry.getCurrentProject().getLayersStore().getLayerById(layerId);
};

proto.showPanel = function(config={}) {
  const panel = new SearchService(config);
  GUI.showPanel(panel);
  return panel;
};

proto.cleanSearchPanels = function() {
  this.state.panels = {};
};

proto.stop = function(){
  const d = $.Deferred();
  d.resolve();
  return d.promise();
};

proto.addTool = function(searchTool) {
  this.state.searchtools.push(searchTool);
};

proto.addTools = function(searchTools) {
  for (const searchTool of searchTools) {
    this.addTool(searchTool);
  }
};

proto.removeTool = function(searchTool) {
  //TODO
};

proto.removeTools = function() {
  this.state.searchtools.splice(0)
};

proto.reload = function() {
  this.state.searches = ProjectsRegistry.getCurrentProject().state.search;
};


module.exports = Service;
