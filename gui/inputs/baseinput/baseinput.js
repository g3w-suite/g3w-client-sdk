// Base object that has common  inputs methods
const Service = require('../service');

const BaseInput = {
  props: ['state'],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./baseinput.html'),
  methods: {
    // called when input value chage
    change: function(options) {
      // validate input
      this.service.validate(options);
      // emit change input
      this.$emit('changeinput', this.state);
    },
    isEditable: function() {
      return this.service.isEditable();
    },
    isVisible: function() {}
  },
  created() {
    // add default values validate and message to show
    Vue.set(this.state.validate, 'valid', true);
    Vue.set(this.state.validate, 'message', null);
    this.change();
    this.$emit('addinput', this.state);
  },
  mounted: function() {
    this.$nextTick(() => {})
  }
};

const BaseInputComponent = Vue.extend({
  mixins: [BaseInput]
});


module.exports = {
  BaseInput: BaseInput,
  BaseInputComponent: BaseInputComponent
};
