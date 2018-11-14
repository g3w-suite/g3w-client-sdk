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
  created() {
    if (this.autocomplete && this.state.value) {
      this.state.input.options.values.push({
        key: 'Pippo',
        value: this.state.value
      })
    }
  },
  mounted() {
    this.$nextTick(() => {
      const selectElement = $(this.$el).find('select');
      let select2;
      const language = this.service.getLanguage();
      if (this.autocomplete) {
        const options = this.state.input.options;
        const {key, value, layer_id} = options;
        select2 = selectElement.select2({
          minimumInputLength: 1,
          language,
          ajax: {
            transport: (params, success, failure) => {
              const search = params.data.term;
              this.resetValues();
              this.service.getData({
                layer_id,
                value,
                key,
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
      } else
        select2 = selectElement.select2({
          language
        });
      if (this.state.value)
        select2.val(this.state.value).trigger('change');
      select2.on('select2:select', (event) => {
        const value = event.params.data.$value? event.params.data.$value : event.params.data.id;
        this.changeSelect(value);
      })
    })
  }
});

module.exports = SelectInput;
