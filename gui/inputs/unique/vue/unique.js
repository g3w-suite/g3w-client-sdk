const Input = require('gui/inputs/input');
const selectMixin = require('gui/inputs/select/vue/selectmixin');
const Service = require('../service');

const UniqueInput = Vue.extend({
  mixins: [Input, selectMixin],
  template: require('./unique.html'),
  data: function() {
    this.select2;
    const uniqueid = 'uniqueinputid_' + Date.now();
    return {
      service: new Service({
        state: this.state
      }),
      id: uniqueid
    }
  },
  watch: {
    'state.input.options.values'(values) {
      this.state.value = this.state.value ? this.state.value: values[0];
      this.change();
      this.$nextTick(()=>{
        if (this.state.input.options.editable) {
          this.select2 = $(`#${this.id}`).select2({
            tags: true
          });
          this.select2.val(this.state.value).trigger('change');
          this.select2.on('select2:select', (event) => {
            const value = event.params.data.$value? event.params.data.$value : event.params.data.id;
            this.changeSelect(value);
          })
        }
      })
    }
  }
});

module.exports = UniqueInput;
