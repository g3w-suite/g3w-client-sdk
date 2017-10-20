var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var RadioValidator = require('./validator');

function RadioService(options) {
  options = options || {};
  options.validator = RadioValidator;
  base(this, options);
}

inherit(RadioService, Service);

var proto = RadioService.prototype;

module.exports = RadioService;