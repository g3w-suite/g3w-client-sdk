const Input = require('gui/inputs/input');
const Service = require('../service');
const getUniqueDomId = require('core/utils/utils').getUniqueDomId;
const WidgetMixins = require('gui/inputs/widgetmixins');

const CheckBoxInput = Vue.extend({
  mixins: [Input, WidgetMixins],
  template: require('./checkbox.html'),
  data: function() {
    const values = this.state.input.options.values.map((value) => {
      return value;
    });
    return {
      service: new Service({
        state: this.state,
        // options to customize validator
        validatorOptions: {
          values
        }
      }),
      value: null,
      label:null,
      id: getUniqueDomId() // new id
    }
  },
  methods: {
    setLabel(){
      // convert label
      this.label = this.service.convertCheckedToValue(this.value);
    },
    setValue() {
      this.value = this.service.convertValueToChecked();
    },
    changeCheckBox: function() {
      // convert label
      this.setLabel();
      this.widgetChanged();
    },
    stateValueChanged() {
      this.setValue();
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
