// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var UniqueInput = Vue.extend({
  mixins: [Input],
  template: require('./unique.html'),
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  }
});

module.exports = UniqueInput;