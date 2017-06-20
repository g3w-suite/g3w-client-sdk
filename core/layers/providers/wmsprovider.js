var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');

function WMSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wms';
}

inherit(WMSDataProvider, DataProvider);

var proto = WMSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

module.exports = WMSDataProvider;