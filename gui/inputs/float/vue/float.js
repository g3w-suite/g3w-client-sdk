// oggetto base utilizzato per i mixins
const Input = require('gui/inputs/input');
const Service = require('../service');

const FloatInput = Vue.extend({
  mixins: [Input],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./float.html')
});

module.exports = FloatInput;
