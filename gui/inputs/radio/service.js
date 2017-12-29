const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function RadioService(options) {
  options = options || {};
  options.validator = RadioValidator;
  base(this, options);
}

inherit(RadioService, Service);

module.exports = RadioService;
