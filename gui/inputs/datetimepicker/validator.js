var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function DateTimePickerValidator() {
  base(this);
  this.validate = function(value, options) {
    var fielddatetimeformat = options.fielddatetimeformat;
    return moment(value, fielddatetimeformat, true).isValid();
  }
}
inherit(DateTimePickerValidator, Validator);

module.exports = new DateTimePickerValidator;
