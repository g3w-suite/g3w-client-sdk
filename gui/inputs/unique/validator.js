var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function UniqueValidator() {
  base(this);
  this.validate = function(value) {
    return true;
  } 
}

inherit(UniqueValidator, Validator);

module.exports = new UniqueValidator;