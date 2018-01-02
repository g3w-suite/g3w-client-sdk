const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const ToolsService = require('gui/tools/toolsservice');

const InternalComponent = Vue.extend({
  template: require('./tools.html'),
  data: function() {
    return {
      state: null
    }
  },
  methods: {
    fireAction: function(actionId) {
      this.$options.toolsService.fireAction(actionId);
    }
  }
});

function ToolsComponent(options) {

  base(this,options);
  this._service = new ToolsService();
  this.id = "tools-component";
  this.title = "tools";
  this.state.visible = false;

  // vado a settare l'onafter nel caso di un add tools che di un remove tool
  this._service.onafter('addTools', () => {
    this.state.visible = this._service.state.toolsGroups.length > 0;
  });
  this._service.onafter('removeTools', () => {
    this.state.visible = this._service.state.toolsGroups.length > 0;
  });
  /* ----------------------*/
  merge(this, options);
  this.internalComponent = new InternalComponent({
    toolsService: this._service
  });
  //sostituisco lo state del servizio allo state del componente vue interno
  this.internalComponent.state = this._service.state;
}

inherit(ToolsComponent, Component);

module.exports = ToolsComponent;
