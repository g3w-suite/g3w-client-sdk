const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function RangeService(options) {
  options = options || {};
  base(this, options);
}

inherit(RangeService, Service);

const proto = Service.prototype;

proto.setValidRangeValue = function(value, min, max, step) {
  if (value > max) {
    return max;
  } else if (value < min) {
    return min;
  }
  return value
};

module.exports = RangeService;
