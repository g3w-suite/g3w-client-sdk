var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function PhotoService(options) {
  var options = options || {};
  this.state = {};
  base(this);
}

inherit(PhotoService, G3WObject);

module.exports = PhotoService;
