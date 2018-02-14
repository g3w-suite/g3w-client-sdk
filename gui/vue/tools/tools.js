const ToolsService = require('./toolsservice');

Vue.component('g3w-tools',{
    template: require('./tools.html'),
    data: function() {
      return {
        tools: ToolsService.state.tools
      }
    },
    methods: {
      fireAction: function(actionid) {
        ToolsService.fireAction(actionid);
      }
    }
});
