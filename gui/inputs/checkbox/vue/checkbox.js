// oggetto base utilizzato per i mixins
const Input = require('gui/inputs/input');
const Service = require('../service');
const WidgetMixins = require('gui/inputs/widgetmixins');

const CheckBoxInput = Vue.extend({
  mixins: [Input, WidgetMixins],
  template: require('./checkbox.html'),
  data: function() {
    const values = _.map(this.state.input.options, function(option) {
      return option.value;
    });
    const label = values.indexOf(this.state.value) != -1 ? this.state.value : null;
    return {
      service: new Service({
        state: this.state,
        // options to customize validator
        validatorOptions: {
          values: values
        }
      }),
      value: false,
      label: label,
      id: 'checkboxinput_' + Date.now() // vado a mettere un id nuovo sempre per le label
    }
  },
  methods: {
    setLabel(){
      // convert label
      this.label = this.service.convertCheckedToValue(this.value);
    },
    setValue(value) {
      this.value = this.service.convertValueToChecked(value);
    },
    changeCheckBox: function() {
      // convert label
      this.setLabel();
      this.widgetChanged();
    },
    stateValueChanged(value) {
      this.setValue(value);
      this.setLabel();
    }
  },
  mounted: function() {
    this.value = this.service.convertValueToChecked();
    this.setLabel();
    this.change();
  }
});

module.exports = CheckBoxInput;
