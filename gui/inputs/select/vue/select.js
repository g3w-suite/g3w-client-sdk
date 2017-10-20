// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var SelectInput = Vue.extend({
  mixins: [Input],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./select.html'),
  mounted: function() {

  }
});

module.exports = SelectInput;