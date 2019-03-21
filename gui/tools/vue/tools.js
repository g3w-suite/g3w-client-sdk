const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const GUI = require('gui/gui');
const Component = require('gui/vue/component');
const ToolsService = require('gui/tools/toolsservice');
import G3wTool from './tool.vue';
const InternalComponent = Vue.extend({
  template: require('./tools.html'),
  data: function() {
    return {
      state: null
    }
  },
  components: {
    G3wTool
  }
});

function ToolsComponent(options) {
  base(this, options);
  this._service = new ToolsService();
  this.title = "tools";
  this.state.visible = false;

  this._service.onafter('addTools', () => {
    this.state.visible = this._service.state.toolsGroups.length > 0;
  });

  this._service.onafter('addToolGroup', () => {
    this.state.visible = this._service.state.toolsGroups.length > 0;
  });

  this._service.onafter('removeTools', () => {
    this.state.visible = this._service.state.toolsGroups.length > 0;

  });
  this.internalComponent = new InternalComponent({
    toolsService: this._service
  });
  this.internalComponent.state = this._service.state;

  this._setOpen = function(bool) {
    if (bool) {
      GUI.closeContent();
    }
  }
}

inherit(ToolsComponent, Component);

module.exports = ToolsComponent;
