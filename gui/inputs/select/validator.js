var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Validator = require('gui/inputs/validator');

function SelectValidator() {
  base(this);
}

inherit(SelectValidator, Validator);

module.exports = new SelectValidator;