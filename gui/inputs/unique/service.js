const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Service = require('gui/inputs/service');

function UniqueService(options={}) {
  base(this, options);
  const defaultValue = this.state.value ? null : this.state.input.options.default;
  if (defaultValue !== undefined || defaultValue !== null) {
    this.setValue(defaultValue);
    this.addValueToValues(defaultValue);
  }
}

inherit(UniqueService, Service);

module.exports = UniqueService;
