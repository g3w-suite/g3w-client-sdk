const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Validator = require('./validator');

function RangeValidator(options={}) {
  base(this, options);
  this.validate = function(value) {
    return value >= this.options.min && value <= this.options.max;
  }
}

inherit(RangeValidator, Validator);

module.exports =  RangeValidator;
