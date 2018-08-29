const TabsMixins = {
  methods: {
    addToValidate: function(input) {
      // aggiunge l'input da validare
      this.$emit('addtovalidate', input.validate);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    }
  }
};

module.exports = TabsMixins;
