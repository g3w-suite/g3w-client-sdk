var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var UniqueValidator = require('./validator');

function UniqueService(options) {
  options = options || {};
  options.validator = UniqueValidator;
  base(this, options);
}

inherit(UniqueService, Service);

var proto = UniqueService.prototype;

module.exports = UniqueService;