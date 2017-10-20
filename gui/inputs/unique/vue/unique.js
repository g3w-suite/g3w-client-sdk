// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var UniqueInput = Vue.extend({
  mixins: [Input],
  template: require('./unique.html'),
  data: function() {
    var uniqueid = 'uniqueinputid_' + Date.now()
    return {
      service: new Service({
        state: this.state
      }),
      id: uniqueid
    }
  },
  mounted: function() {
    var self = this;
    this.$nextTick(function() {
      if (self.state.input.options.editable)
        $('#'+self.id).select2();
    })
  }
});

module.exports = UniqueInput;