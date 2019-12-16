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
  watch: {
    'state.toolsGroups': {
      handler(groups) {
        this.$emit('visible', groups.length > 0);
      }
    }
  },
  components: {
    G3wTool
  }
});

function ToolsComponent(options={}) {
  base(this, options);
  this._service = new ToolsService(options);
  this.title = "tools";

  const internalComponent = new InternalComponent({
    toolsService: this._service
  });

  internalComponent.state = this._service.state;
  this.setInternalComponent(internalComponent, {
    events: [{name: 'visible'}]
  });

  this._setOpen = function(bool=false) {
    this.internalComponent.state.open = bool;
    bool && GUI.closeContent();
  }
}

inherit(ToolsComponent, Component);

module.exports = ToolsComponent;
