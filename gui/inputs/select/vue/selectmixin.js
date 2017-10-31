var selectMixin = {
  methods: {
    changeSelect: function() {
      this.state.value = this.state.value == 'null' ? null : this.state.value;
      this.change();
    },
    getValue: function(value) {
      return _.isNull(value) ? 'null' : value;
    }
  }
};

module.exports = selectMixin;
