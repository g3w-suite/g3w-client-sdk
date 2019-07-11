const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function RangeService(options={}) {
  base(this, options);
}

inherit(RangeService, Service);

const proto = Service.prototype;

proto.setValidRangeValue = function(value, min, max) {
  return (value > max || value < min) ? null : value;

};

module.exports = RangeService;
