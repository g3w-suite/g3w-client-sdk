const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');

function ToolsService(){
  this.config = null;
  this._actions = {};
  this.state = {
    tools: []
  };
  
  this.init = function(config){
    this.config = config;
    this.setState();
  };
  
  this.setState = function(){
    this._mergeTools(this.config.tools);
  };
  
  this.registerToolsProvider = function(plugin){
    this._mergeTools(plugin.getTools());
    this._addActions(plugin);
  };
  
  this.fireAction = function(actionid){
    const plugin = this._actions[actionid];
    const method = this._actionMethod(actionid);
    plugin[method]();
  };
  
  this._actionMethod = function(actionid){
    const namespace = actionid.split(":");
    return namespace.pop();
  };
  
  this._mergeTools = function(tools){
    this.state.tools = _.concat(self.state.tools,tools);
  };
  
  this._addActions = function(plugin){
    plugin.getTools().forEach((tool) => {
      plugin.getActions(tool).forEach((action) => {
        this._actions[action.id] = plugin;
      })
    })
  };
}

inherit(ToolsService,G3WObject);

module.exports = new ToolsService;
