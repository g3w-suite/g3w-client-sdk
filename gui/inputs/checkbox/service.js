const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function CheckBoxService(options) {
  options = options || {};
  base(this, options);
}

inherit(CheckBoxService, Service);

const proto = CheckBoxService.prototype;

proto.convertCheckedToValue = function(checked) {
  let value;
  const options = this.state.input.options;
  options.forEach((option) => {
    if (option.checked === checked) {
      this.state.value = value = option.value;
      return false;
    }
  });
  return value;
};

proto.convertValueToChecked = function() {
  let checked = null;
  const options = this.state.input.options;
  options.forEach((option) =>{
    if (option.value === this.state.value) {
      checked = option.checked;
      return false;
    }
  });
  return checked
};


module.exports = CheckBoxService;
