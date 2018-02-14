const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const ProjectsRegistry = require('core/project/projectsregistry');
const G3WObject = require('core/g3wobject');
const SearchPanel = require('gui/search/vue/panel/searchpanel');

function SearchesService(){
  this.init = function(searchesObject) {
    const searches = searchesObject || ProjectsRegistry.getCurrentProject().state.search;
    this.state.searches = searches;
  };
  this.state = {
    searches: []
  };
  this.showSearchPanel = function(panelConfig) {
    const panel =  new SearchPanel();
    panel.init(panelConfig);
    GUI.showPanel(panel);
    return panel;
  };

  this.cleanSearchPanels = function() {
    this.state.panels = {};
  };

  this.stop = function(){
    const d = $.Deferred();
    d.resolve();
    return d.promise();
  };

  this.reload = function() {
    const searches = ProjectsRegistry.getCurrentProject().state.search;
    Vue.set(this.state, 'searches', searches);
  }
}

inherit(SearchesService, G3WObject);

module.exports = SearchesService;
