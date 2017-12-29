const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Validator = require('./validator');

function CheckBoxValidator() {
  base(this);
  this.validate = function(value, options) {
    const values = options.values || [];
    return values.indexOf(value) != -1;
  }
}

inherit(CheckBoxValidator, Validator);

module.exports =  CheckBoxValidator;
