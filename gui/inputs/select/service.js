var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');

function SelectService(options) {
  options = options || {};
  base(this, options);
}

inherit(SelectService, Service);

var proto = SelectService.prototype;

module.exports = SelectService;
