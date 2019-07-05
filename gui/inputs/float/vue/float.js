const Input = require('gui/inputs/input');
const Service = require('../service');

const FloatInput = Vue.extend({
  mixins: [Input],
  template: require('./float.html'),
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  }
});

module.exports = FloatInput;
