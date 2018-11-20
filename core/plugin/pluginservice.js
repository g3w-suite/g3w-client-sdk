const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function PluginService(options) {
  options = options || {};
  base(this, options);
  this._api = {
    own: null,
    dependencies: {}
  };
  this.init = function(config) {
    this.config = config;
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

proto.setApi = function({dependency, api} = {}) {
  if (!dependency)
    this._api.own = api;
  else
    this._api.dependencies[dependency] = api;
};

proto.getApi = function({dependency} = {}) {
  return dependency && this._api.dependencies[dependency] || this._api.own;
};


module.exports = PluginService;
