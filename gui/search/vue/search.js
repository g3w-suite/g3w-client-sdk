import G3wTool from 'gui/tools/vue/tool.vue'
import { createCompiledTemplate } from 'gui/vue/utils';
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const Service = require('gui/search/service');
const templateCompiled = createCompiledTemplate(require('./search.html'));

const vueComponentOptions = {
  ...templateCompiled,
   data: function() {
     return {
       state: null
     };
   },
  components: {
    G3wTool
  },
   methods: {
    showPanel: function(config={}) {
      this.$options.service.showPanel(config);
    }
  }
};

const InternalComponent = Vue.extend(vueComponentOptions);

function SearchComponent(options={}){
  base(this, options);
  this.id = "search";
  this._service = options.service || new Service();
  this._service.init();
  this.title = this._service.getTitle();
  this.internalComponent = new InternalComponent({
    service: this._service
  });
  this.internalComponent.state = this._service.state;
  this.state.visible = (this._service.state.searches.length + this._service.state.searchtools.length) > 0;
  const handlerVisible = (bool) =>{
    this.state.visible = bool;
  };
  this._searches_searchtools = new Vue();
  this._searches_searchtools.$watch(() => (this._service.state.searches.length + this._service.state.searchtools.length) > 0 , {
    immediate: true,
    handler: handlerVisible
  });
  this._reload = function() {
    this._service.reload();
  };
  this.unmount = function() {
    this._searches_searchtools.$destroy();
    return base(this, 'unmount');
  }
}

inherit(SearchComponent, Component);

module.exports = SearchComponent;
