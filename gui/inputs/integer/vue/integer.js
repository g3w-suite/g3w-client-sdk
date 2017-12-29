// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var IntegerInput = Vue.extend({
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
