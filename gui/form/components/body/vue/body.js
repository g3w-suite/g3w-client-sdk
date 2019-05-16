const BodyTemplate = require('./body.html');
import G3wFormInputs from '../../../../inputs/g3w-form-inputs.vue';
import Tabs from '../../../../tabs/tabs.vue';
const G3wFormFooter = require('gui/form/components/footer/vue/footer');
const BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  data() {
    return {
      show: true
    }
  },
  components: {
    Tabs,
    G3wFormFooter,
    G3wFormInputs
  },
  methods: {
    addToValidate: function(input) {
      this.$emit('addtovalidate', input);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    }
  },
  computed: {
    hasFormStructure() {
      return !!this.state.formstructure;
    }
  }
});

module.exports = BodyFormComponent;
