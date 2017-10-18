// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var DateTimePickerInput = Vue.extend({
  mixins: [Input],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  computed: {
  },
  template: require('./datetimepicker.html'),
  mounted: function() {
    this.$nextTick(function() {
      $(function() {
        $('#datetimepicker').datetimepicker({
          format: 'dd/MM/yyyy hh:mm:ss'
        });
      });
    })
  }
});

module.exports = DateTimePickerInput;