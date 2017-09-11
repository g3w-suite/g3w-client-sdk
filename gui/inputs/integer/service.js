var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var IntegerValidator = require('./validator');

function IntegerService(options) {
  options = options || {};
  options.validator = IntegerValidator;
  base(this, options);
}

inherit(IntegerService, Service);

var proto = IntegerService.prototype;

module.exports = IntegerService;