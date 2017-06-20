var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');


function WFSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wfs';
}

inherit(WFSDataProvider, DataProvider);

var proto = WFSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};


module.exports = WFSDataProvider;