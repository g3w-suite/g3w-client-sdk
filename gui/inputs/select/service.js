var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var SelectValidator = require('./validator');

function SelectService(options) {
  options = options || {};
  options.validator = SelectValidator;
  base(this, options);
}

inherit(SelectService, Service);

var proto = SelectService.prototype;

module.exports = SelectService;