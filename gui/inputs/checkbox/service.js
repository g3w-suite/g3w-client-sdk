var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var CheckValidator = require('./validator');

function IntegerService(options) {
  options = options || {};
  options.validator = CheckValidator;
  base(this, options);
}

inherit(IntegerService, Service);

var proto = IntegerService.prototype;

module.exports = IntegerService;