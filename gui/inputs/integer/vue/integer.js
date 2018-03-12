// oggetto base utilizzato per i mixins
const Input = require('gui/inputs/input');
const Service = require('../service');

const IntegerInput = Vue.extend({
  mixins: [Input],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./integer.html')
});

module.exports = IntegerInput;
