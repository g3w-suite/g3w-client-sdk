var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function RangeValidator() {
  base(this);
  this.validate = function(value) {
    var value = 1*value;
    return !_.isNaN(value) ? _.isNumber(value) : false;
  } 
}
inherit(RangeValidator, Validator);
module.exports = new RangeValidator;