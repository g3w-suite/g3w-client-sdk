var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');

function KMLDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'kml';
}

inherit(KMLDataProvider, DataProvider);

var proto = KMLDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};


module.exports = KMLDataProvider;