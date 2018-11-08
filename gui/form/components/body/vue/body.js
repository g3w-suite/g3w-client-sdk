const BodyTemplate = require('./body.html');
const Inputs = require('gui/inputs/inputs');
import Tabs from '../../../../tabs/tabs.vue';
const g3wFormFooter = require('gui/form/components/footer/vue/footer');

const BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  data() {
    return {
      show: true
    }
  },
  components: {
    ...Inputs,
    Tabs,
    g3wFormFooter
  },
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
    },
    datetimepickerShow: function() {
      $(".nano").nanoScroller();
    }
  },
  computed: {
    hasFormStructure() {
      return !!this.state.formstructure;
    }
  }
});

module.exports = BodyFormComponent;
