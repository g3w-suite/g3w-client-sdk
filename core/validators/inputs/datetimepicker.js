const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Validator = require('./validator');

function DateTimePickerValidator() {
  base(this);
  this.validate = function(value, options) {
    const fielddatetimeformat = options.fielddatetimeformat;
    return moment(value, fielddatetimeformat, true).isValid();
  }
}
inherit(DateTimePickerValidator, Validator);

module.exports =  DateTimePickerValidator;
