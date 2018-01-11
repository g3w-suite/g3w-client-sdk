// oggetto base utilizzato per i mixins
const Input = require('gui/inputs/input');
const Service = require('../service');

const CheckBoxInput = Vue.extend({
  mixins: [Input],
  template: require('./checkbox.html'),
  data: function() {
    const values = _.map(this.state.input.options, function(option) {
      return option.value;
    });
    const label = values.indexOf(this.state.value) != -1 ? this.state.value : null;
    return {
      service: new Service({
        state: this.state,
        // optione che mi server per customizzare i validator
        validatorOptions: {
          values: values
        }
      }),
      value: null,
      label: label,
      id: 'checkboxinput_' + Date.now() // vado a mettere un id nuovo sempre per le label
    }
  },
  methods: {
    changeCheckBox: function() {
      // faccio conversione della label
      this.label = this.service.convertCheckedToValue(this.value);
      // e lancio il metodo change del baseinput
      this.change();
    }
  },
  mounted: function() {
    this.value = this.service.convertValueToChecked();
  }
});

module.exports = CheckBoxInput;
