var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var EditingTool = require('./editingtool');

function EditAttributes() {
  base(this);
}
inherit(EditAttributes, EditingTool);

module.exports = EditAttributes;
