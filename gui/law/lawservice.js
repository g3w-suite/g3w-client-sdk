var inherit = require('core/utils/utils').inherit;
var G3WObject = require('core/g3wobject');

function LawComponentService(options) {
  base(this);
}

// Make the public service en Event Emitter
inherit(LawComponentService, G3WObject);

module.exports = LawComponentService;
