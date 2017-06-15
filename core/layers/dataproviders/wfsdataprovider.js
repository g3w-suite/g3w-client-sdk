var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function WFSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wfs';
}

inherit(WFSDataProvider, G3WObject);

var proto = WFSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};


module.exports = WFSDataProvider;