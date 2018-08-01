const BodyTemplate = require('./body.html');
// get inputs
const Inputs = require('gui/inputs/inputs');

const BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  components: Inputs, // load inputs as components
  methods: {
    getInputComponent(field) {
      return field.input.type+'_input';
    },
    addToValidate: function(input) {
      // add input to validate
      this.$emit('addtovalidate', input.validate);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    },
    reloadLayout: function(index) {
      if (index === this.state.fields.length - 1) {
        this.$emit('reloadlayout');
      }
      return true
    }
  }
});

module.exports = BodyFormComponent;
