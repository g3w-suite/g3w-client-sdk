const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function ToolsService(){
  this.config = null;
  this._actions = {};
  this.state = {
    toolsGroups: []
  };
  this.setters = {
    addTools: function(order, groupName, tools) {
      this._addTools(order, groupName, tools);
    },
    addToolGroup: function(order, group) {
      this.state.toolsGroups.splice(order, 0, group);
    },
    removeTools:function() {
      this._removeTools();
    }
  };

  this._addTools = function(order, groupName, tools) {
    let group = this._getToolsGroup(groupName);
    if (!group) {
      group = {
        name: groupName,
        tools: []
      };
      this.addToolGroup(order, group);
    }
    tools.forEach((tool) => {
      group.tools.push(tool);
      this._addAction(tool);
    });
  };

  this._removeTool = function(toolIdx) {
    this.state.toolsGroups = this.state.toolsGroups.splice(toolIdx, 1);
  };

  this._removeTools = function() {
    this.state.toolsGroups = []
  };

  this.updateToolsGroup = function(order, groupConfig) {
    Vue.set(this.state.toolsGroups, order, groupConfig);
  };

  this.getState = function() {
    return this.state;
  };

  this.fireAction = function(actionId){
    const action = this._actions[actionId];
    action();
  };

  this._getToolsGroup = function(groupName) {
    let group = null;
    this.state.toolsGroups.forEach((_group) => {
      if (_group.name == groupName) {
        group = _group;
      }
    });
    return group;
  };

  this._addAction = function(tool) {
    const actionId = Math.floor(Math.random() * 1000000) + 1;
    tool.actionId = actionId;
    this._actions[actionId] = tool.action;
  };

  base(this);
}

inherit(ToolsService, G3WObject);

module.exports = ToolsService;
