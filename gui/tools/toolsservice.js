const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function ToolsService(){
  this.config = null;
  this._actions = {};
  this.state = {
    toolsGroups: [],
    loading: false
  };
  this.setters = {
    addTools: function(order, groupName, tools) {
      this._addTools(order, groupName, tools);
    },
    addToolGroup: function(order, name) {
      this._addToolGroup(order, name);
    },
    removeTools:function() {
      this._removeTools();
    }
  };

  this.reload = function() {
    this.removeTools();
  };

  this._addTools = function(tools, {position : order, title: name}) {
    let group = this._addToolGroup(order, name);
    tools.forEach((tool) => {
      group.tools.push(tool);
    });
  };

  this.setLoading = function(bool=false) {
    this.state.loading = bool;
  };

  this._removeTool = function(toolIdx) {
    this.state.toolsGroups = this.state.toolsGroups.splice(toolIdx, 1);
  };

  this._removeTools = function() {
    this.state.toolsGroups.splice(0);
  };

  this.updateToolsGroup = function(order, groupConfig) {
    Vue.set(this.state.toolsGroups, order, groupConfig);
  };

  this.getState = function() {
    return this.state;
  };

  this._addToolGroup = function(order, name) {
    let group = this.state.toolsGroups.find((_group) => {
      return _group.name === name
    });
    if (!group) {
      group = {
        name,
        tools: []
      };
      this.state.toolsGroups.splice(order, 0, group);
    }
    return group;
  };

  base(this);
}

inherit(ToolsService, G3WObject);

module.exports = ToolsService;
