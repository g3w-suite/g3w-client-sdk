var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function WMSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wms';
}

inherit(WMSDataProvider, G3WObject);

var proto = WMSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

module.exports = WMSDataProvider;