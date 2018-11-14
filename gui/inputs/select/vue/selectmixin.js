var selectMixin = {
  methods: {
    changeSelect: function(value) {
      this.state.value = value == 'null' ? null : value;
      this.change();
    },
    getValue: function(value) {
      return _.isNull(value) ? 'null' : value;
    },
    resetValues() {
      this.state.input.options.values.splice(0);
    }
  },
  computed: {
    autocomplete() {
      return this.state.input.type === 'select_autocomplete' && this.state.input.options.usecompleter;
    }
  }
};

module.exports = selectMixin;
