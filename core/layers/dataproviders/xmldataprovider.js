var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function XMLDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'xml';
}

inherit(XMLDataProvider, G3WObject);

var proto = XMLDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

module.exports = XMLDataProvider;