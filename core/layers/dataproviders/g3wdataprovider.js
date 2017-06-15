var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function G3WDataProvider(options) {
  options = options || {};
  this.getData = function() {
    var d = $.Deferred();
    return d.promise();
  };
  base(this);
}

inherit(G3WDataProvider, G3WObject);

module.exports = G3WDataProvider;
