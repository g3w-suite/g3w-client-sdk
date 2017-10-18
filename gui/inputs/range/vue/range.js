// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var RangeInput = Vue.extend({
  mixins: [Input],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  computed: {
    step: function() {
      return 1*this.state.input.options[0].Step;
    },
    min: function() {
      return 1*this.state.input.options[0].min;
    },
    max: function() {
      return 1*this.state.input.options[0].max;
    },
    value: function() {
      var value = 1*this.state.value;
      return _.isNumber(value) && !_.isNaN(value) ? value : null
    }
  },
  template: require('./range.html')
});

module.exports = RangeInput;