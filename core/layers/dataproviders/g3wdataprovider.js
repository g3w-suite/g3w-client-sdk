var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function G3WDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'g3w';
}

inherit(G3WDataProvider, G3WObject);

var proto = G3WDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};


module.exports = G3WDataProvider;
