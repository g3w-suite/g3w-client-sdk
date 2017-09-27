var BodyTemplate = require('./body.html');
var Inputs = require('gui/inputs/inputs');

var BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  components: Inputs,
  methods: {
    addToValidate: function(input) {
      // aggiunge l'input da validare
      this.$emit('addtovalidate', input.validate);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    },
    reloadLayout: function(index) {
      if (index == this.state.fields.length - 1) {
        this.$emit('reloadlayout');
      }
      return true
    }
  }
});

module.exports = BodyFormComponent;