const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const ProjectsRegistry = require('core/project/projectsregistry');
const SearchesService = require('gui/search/searchesservice');
import G3wTool from 'gui/tools/vue/tool.vue'

const vueComponentOptions = {
   template: require('./search.html'),
   data: function() {
    	return {
    	  state: null
    	};
   },
  components: {
    G3wTool
  },
   methods: {
    showSearchPanel: function(search) {
        this.$options.service.showSearchPanel(search);
    }
  }
};

const InternalComponent = Vue.extend(vueComponentOptions);

function SearchComponent(options){
  base(this,options);
  this.id = "search";
  this._service = new SearchesService();
  this.title = this._service.getTitle();
  this.internalComponent = new InternalComponent({
    service: this._service
  });
  this.internalComponent.state = this._service.state;
  this.state.visible = ProjectsRegistry.getCurrentProject().state.search.length > 0;
  this.initService = function() {
    this._service.init();
  };

  this._reload = function() {
    this.state.visible = ProjectsRegistry.getCurrentProject().state.search.length > 0;
    this._service.reload();
  };
}

inherit(SearchComponent, Component);
module.exports = SearchComponent;
