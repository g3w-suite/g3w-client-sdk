var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function RadioValidator() {
  base(this);
  this.validate = function(value) {
    return true;
  } 
}

inherit(RadioValidator, Validator);

module.exports = new RadioValidator;