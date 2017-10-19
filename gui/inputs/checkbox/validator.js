var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function CheckValidator() {
  base(this);
  this.validate = function(value, options) {
    var values = options.values || [];
    return values.indexOf(value) != -1;
  }
}

inherit(CheckValidator, Validator);

module.exports = new CheckValidator;