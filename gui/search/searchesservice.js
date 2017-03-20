var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');
var G3WObject = require('core/g3wobject');
var SearchPanel = require('gui/search/vue/panel/searchpanel');

function SearchesService(){

  this.init = function(searchesObject) {
    var searches = searchesObject || ProjectsRegistry.getCurrentProject().state.search;
    this.state.searches = searches;
  };
  this.state = {
    searches: []
  };
  this.showSearchPanel = function(panelConfig) {
    var panel =  new SearchPanel();// creo panello search
    panel.init(panelConfig);//inizializzo pannello se
    GUI.showPanel(panel);
    return panel;
  };

  this.cleanSearchPanels = function() {
    this.state.panels = {};
  };

  this.stop = function(){
    var deferred = $.Deferred();
    deferred.resolve();
    return deferred.promise();
  };

  this.reload = function() {
    var searches = ProjectsRegistry.getCurrentProject().state.search;
    Vue.set(this.state, 'searches', searches);
  }
}

// Make the public service en Event Emitter
inherit(SearchesService, G3WObject);

module.exports = SearchesService;
