// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var RangeInput = Vue.extend({
  mixins: [Input],
  template: require('./range.html'),
  data: function() {
    const options = this.state.input.options.values[0];
    const min = 1*options.min;
    const max = 1*options.max;
    const step = 1*options.Step;
    return {
      max: max,
      min: min,
      step: step,
      service: new Service({
        state: this.state
      })
    }
  },
  methods: {
    checkValue: function() {
      this.state.value = this.service.setValidRangeValue(1*this.state.value, this.min, this.max, this.step);
      this.change();
    }
  },
  created() {}
});

module.exports = RangeInput;
