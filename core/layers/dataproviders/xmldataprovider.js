var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/dataproviders/dataprovider').DataProvider;

function XMLDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'xml';
}

inherit(XMLDataProvider, DataProvider);

var proto = XMLDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

module.exports = XMLDataProvider;