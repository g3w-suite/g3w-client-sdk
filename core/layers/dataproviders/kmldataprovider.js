var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function KMLDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'kml';
}

inherit(KMLDataProvider, G3WObject);

var proto = KMLDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};


module.exports = KMLDataProvider;