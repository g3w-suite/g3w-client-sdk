var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function DateTimePickerValidator() {
  base(this);
}
inherit(DateTimePickerValidator, Validator);

module.exports = new DateTimePickerValidator;