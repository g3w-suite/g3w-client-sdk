var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var CheckValidator = require('./validator');

function IntegerService(options) {
  options = options || {};
  options.validator = CheckValidator;
  base(this, options);
}

inherit(IntegerService, Service);

var proto = IntegerService.prototype;

proto.convertCheckedToValue = function(checked) {
  var self = this;
  var value;
  var options = this.state.input.options;
  _.forEach(options, function(option) {
    if (option.checked === checked) {
      self.state.value = value = option.value;
      return false;
    }
  });
  return value;
};

proto.convertValueToChecked = function() {
  var self = this;
  var checked = null;
  var options = this.state.input.options;
  _.forEach(options, function(option) {
    if (option.value === self.state.value) {
      checked = option.checked;
      return false;
    }
  });
  return checked
};


module.exports = IntegerService;