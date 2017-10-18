var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var DateTimePickerValidator = require('./validator');

function DateTimePickerService(options) {
  options = options || {};
  options.validator = DateTimePickerValidator;
  base(this, options);
}

inherit(DateTimePickerService, Service);

var proto = DateTimePickerService.prototype;

module.exports = DateTimePickerService;