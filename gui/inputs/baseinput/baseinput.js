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
  computed: {
    notvalid() {
      return this.state.validate.valid === false;
    }
  },
  methods: {
    // called when input value change
    change: function(options={}) {
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
    if (this.state.validate === undefined)
      this.state.validate = {};
    this.$set(this.state.validate, 'valid', false);
    this.$set(this.state.validate, 'message', this.service.getErrorMessage(this.state.type));
    if (this.state.validate.required === undefined)
      this.$set(this.state.validate, 'required', false) ;
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
