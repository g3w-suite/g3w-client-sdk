const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function CheckBoxService(options={}) {
  base(this, options);
  this.state.value = this.state.value !== undefined ? this.state.value : this.convertCheckedToValue(false);
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

proto.convertValueToChecked = function(value=null) {
  let checked = null;
  const valueToCheck = value|| this.state.value;
  const options = this.state.input.options;
  if (valueToCheck === null)
    return false;
  options.forEach((option) => {
    if (option.value === valueToCheck) {
      checked = option.checked;
      return false;
    }
  });
  return checked
};


module.exports = CheckBoxService;
