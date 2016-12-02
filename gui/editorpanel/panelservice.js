var inherit = require('core/utils/utils').inherit;

var PluginService = require('core/plugin/pluginservice');

function PanelService() {
  base(this);
}

inherit(PanelService, PluginService);

module.exports = PanelService;