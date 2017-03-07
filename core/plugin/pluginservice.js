var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

// classe utilizzata dai plugin per il servizo
// al momento inizilaizza il config
function PluginService(options) {
  var options = options || {};
  base(this, options);
  this.init = function(config) {
    this.config = config;
    //TODO
  }
}

inherit(PluginService, G3WObject);

var proto = PluginService.prototype;

proto.getConfig = function() {
  return this.config;
};

proto.setConfig = function(config) {
  this.config = config;
};



module.exports = PluginService;