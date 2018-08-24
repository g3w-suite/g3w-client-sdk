const TabsMixins = {
  methods: {
    addToValidate: function(input) {
      // aggiunge l'input da validare
      this.$emit('addtovalidate', input.validate);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    },
    getNodeType(node) {
      return node.groupbox ? 'group': 'field';
    }
  }
};

module.exports = TabsMixins;
