var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function CheckValidator() {
  base(this);
  this.validate = function(value) {
    console.log(value);
    return _.isBoolean(value);
  } 
}

inherit(CheckValidator, Validator);

module.exports = new CheckValidator;