const Input = require('gui/inputs/input');
const selectMixin = require('gui/inputs/select/vue/selectmixin');
const WidgetMixins = require('gui/inputs/widgetmixins');
const Service = require('../service');

const UniqueInput = Vue.extend({
  mixins: [Input, selectMixin, WidgetMixins],
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
  methods: {
    stateValueChanged(value) {
      value = value === null ? 'null': value;
      $('#'+this.id).val(value).trigger('change.select2');
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
          self.widgetChanged();
        })
      }
    })
  }
});

module.exports = UniqueInput;
