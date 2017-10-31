// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var selectMixin = require('./selectmixin');
var Service = require('../service');

var SelectInput = Vue.extend({
  mixins: [Input, selectMixin],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./select.html')

});

module.exports = SelectInput;