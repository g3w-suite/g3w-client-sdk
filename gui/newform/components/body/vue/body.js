var BodyTemplate = require('./body.html');
var Service = require('../service');
var Inputs = require('gui/inputs/inputs');

var BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  components: Inputs,
  methods: {
    addToValidate: function(validate) {
      this.$emit('addtovalidate', validate)
    },
    validateInputs: function() {
      this.$emit('validateform');
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