var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var RangeValidator = require('./validator');

function RangeService(options) {
  options = options || {};
  options.validator = RangeValidator;
  base(this, options);
}

inherit(RangeService, Service);

var proto = RangeService.prototype;

module.exports = RangeService;