const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function PluginService(options) {
  options = options || {};
  base(this, options);
  this.init = function(config) {
    this.config = config;
    //TODO
  }
}

inherit(PluginService, G3WObject);

const proto = PluginService.prototype;

proto.getConfig = function() {
  return this.config;
};

proto.setConfig = function(config) {
  this.config = config;
};



module.exports = PluginService;
