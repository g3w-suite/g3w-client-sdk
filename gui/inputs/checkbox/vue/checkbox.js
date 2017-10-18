// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var CheckBoxInput = Vue.extend({
  mixins: [Input],
  template: require('./checkbox.html'),
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  computed: {
    label: function() {
      var self = this;
      var label;
      var options = this.state.input.options;
      _.forEach(options, function(option) {
        if (option.checked === self.state.value) {
          label = option.value;
          return;
        }
      });
      return label
    }
  }
});

module.exports = CheckBoxInput;