const Input = require('gui/inputs/input');
const selectMixin = require('gui/inputs/select/vue/selectmixin');
const Service = require('../service');

const UniqueInput = Vue.extend({
  mixins: [Input, selectMixin],
  template: require('./unique.html'),
  data: function() {
    const uniqueid = 'uniqueinputid_' + Date.now();
    return {
      service: new Service({
        state: this.state
      }),
      id: uniqueid
    }
  },
  mounted: function() {
    const self = this;
    this.$nextTick(function() {
      if (self.state.input.options.editable) {
        $('#'+self.id).select2({
          tags: true
        });
        $('#'+self.id).on('change', function(e) {
          self.state.value = this.value == 'null' ? null : this.value;
          self.change();
        })
      }
    })
  }
});

module.exports = UniqueInput;
