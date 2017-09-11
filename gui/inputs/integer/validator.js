var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function IntegerValidator() {
  base(this);
  this.validate = function(value) {
    var integer = 1*value;
    return !_.isNaN(integer) ? _.isNumber(1*value) : false;

  } 
}

inherit(IntegerValidator, Validator);

module.exports = new IntegerValidator;