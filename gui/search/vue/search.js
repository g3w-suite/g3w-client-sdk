const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const ProjectsRegistry = require('core/project/projectsregistry');
const SearchesService = require('gui/search/searchesservice');

const vueComponentOptions = {
   template: require('./search.html'),
   data: function() {
    	return {
    	  state: null
    	};
   },
   methods: {
    showSearchPanel: function(search) {
        this.$options.searchesService.showSearchPanel(search);
    }
  }
};

const InternalComponent = Vue.extend(vueComponentOptions);

function SearchComponent(options){
  base(this,options);
  this.id = "search-component";
  this.title = "search";
  this._service = new SearchesService();
  this.internalComponent = new InternalComponent({
    searchesService: this._service
  });
  this.internalComponent.state = this._service.state;
  this.state.visible = ProjectsRegistry.getCurrentProject().state.search.length > 0;
  merge(this, options);
  this.initService = function() {
    this._service.init();
  };

  this._reload = function() {
    this.state.visible = ProjectsRegistry.getCurrentProject().state.search.length > 0;
    this._service.reload();
  }
}

inherit(SearchComponent, Component);
module.exports = SearchComponent;
