var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/dataproviders/dataprovider');

function G3WDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'g3w';
}

inherit(G3WDataProvider, DataProvider);

var proto = G3WDataProvider.prototype;

proto.getFeatures = function(options) {
  options = options || {};
};

proto.query = function(options) {
  var d = $.Deferred();
  d.resolve('ci saranno i dati');
  return d.promise()
};


module.exports = G3WDataProvider;
