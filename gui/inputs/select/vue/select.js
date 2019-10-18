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
  template: require('./select.html'),
  watch: {
    'state.input.options.values'(values) {
     if (!this.autocomplete && !this.state.value && values.length)
       this.changeSelect(values[0].value);
    }
  },
  created() {
    if (this.autocomplete && this.state.value) {
      this.service.getKeyByValue({
        search: this.state.value
      })
    }
    if (!this.state.value) {
      this.state.value = this.state.input.options.values.length ? this.state.input.options.values[0].value : null;
    }
  },
  mounted() {
    this.$nextTick(() => {
      const selectElement = $(this.$el).find('select');
      const language = this.service.getLanguage();
      if (this.autocomplete) {
        this.select2 = selectElement.select2({
          minimumInputLength: 1,
          language,
          ajax: {
            transport: (params, success, failure) => {
              const search = params.data.term;
              this.resetValues();
              this.service.getData({
                search
              }).then((values) => {
                success(values)
              }).catch((err) => {
                failure(err)
              })
            },
            processResults:  (data, params) => {
              params.page = params.page || 1;
              return {
                results: data,
                pagination: {
                  more: false
                }
              }
            }
          },
        });
      } else {
        this.select2 = selectElement.select2({
          language
        });
      }
      if (this.state.value)
        this.select2.val(this.state.value).trigger('change');
      this.select2.on('select2:select', (event) => {
        const value = event.params.data.$value? event.params.data.$value : event.params.data.id;
        this.changeSelect(value);
      });
    })
  }
});

module.exports = SelectInput;
