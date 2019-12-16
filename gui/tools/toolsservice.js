const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function ToolsService(options={}){
  this.config = null;
  this._actions = {};
  this.state = {
    ...options,
    toolsGroups: [],
    visible: false,
    loading: false
  };
  this.setters = {
    addTool(tool, groupName) {
      return this._addTool(tool, groupName);
    },
    addTools(tools, groupName) {
      return this._addTools(tools, groupName);
    },
    addToolGroup(order, name) {
      return this._addToolGroup(order, name);
    },
    removeToolGroup(name){
      return this._removeToolGroup(name);
    },
    removeTools() {
      return this._removeTools();
    }
  };

  this.reload = function() {
    this.removeTools();
  };

  this._addTool = function(tool, {position : order, title: name}) {
    let group = this._addToolGroup(order, name);
    group.tools.push(tool);
  };

  this._addTools = function(tools, groupName) {
    tools.forEach((tool) => {
      this.addTool(tool, groupName)
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

  this._removeToolGroup = function(name) {
    this.state.toolsGroups = this.state.toolsGroups.filter(group =>{
      return group.name !== name;
    });
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
