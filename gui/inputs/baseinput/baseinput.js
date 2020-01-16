// Base object that has common  inputs methods
const Service = require('../service');

const BaseInput = {
  props: ['state'],
  template: require('./baseinput.html'),
  computed: {
    notvalid() {
      if (this.state.validate.valid === false) this.service.getErrorMessage(this.state);
      return this.state.validate.valid === false;
    }
  },
  methods: {
    // called when input value change
    change: function() {
      // validate input
      this.service.validate();
      // emit change input
      this.$emit('changeinput', this.state);
    },
    isEditable: function() {
      return this.service.isEditable();
    },
    isVisible: function() {}
  },
  created() {
    if (!this.service)
      this.service = new Service({
        state: this.state
      });
    if (this.state.validate === undefined)
      this.state.validate = {};
    this.$set(this.state.validate, 'valid', false);
    this.$set(this.state.validate, 'unique', true);
    this.$set(this.state.validate, 'message', this.service.getErrorMessage(this.state));
    if (this.state.validate.required === undefined)
      this.$set(this.state.validate, 'required', false) ;
    this.state.validate.required && this.$set(this.state.validate, 'empty', true);
    this.service.validate();
    this.$emit('addinput', this.state);
  }
};

const BaseInputComponent = Vue.extend({
  mixins: [BaseInput]
});


module.exports = {
  BaseInput: BaseInput,
  BaseInputComponent: BaseInputComponent
};
