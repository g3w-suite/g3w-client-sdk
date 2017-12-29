const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Validator = require('./validator');

function IntegerValidator() {
  base(this);
  this.validate = function(value) {
    const integer = 1*value;
    return !_.isNaN(integer) ? _.isNumber(1*value) : false;

  }
}

inherit(IntegerValidator, Validator);

module.exports =  IntegerValidator;
