const Input = require('gui/inputs/input');
const Service = require('../service');

const RangeInput = Vue.extend({
  mixins: [Input],
  template: require('./range.html'),
  data() {
    const options = this.state.input.options.values[0];
    const min = 1*options.min;
    const max = 1*options.max;
    const step = 1*options.Step;
    return {
      max,
      min,
      step: step,
      service: new Service({
        state: this.state
      })
    }
  },
  methods: {
    checkValue() {
      this.change();
    }
  },
  created() {
    this.state.info = `(min: ${this.min} - max: ${this.max})`
  }
});

module.exports = RangeInput;
