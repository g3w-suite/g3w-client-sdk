const InputServices = require('./services');
const BaseInput = require('./baseinput/baseinput').BaseInput;
const BaseInputMixin= require('./baseinput/baseinput').BaseInputMixin;
const Input = {
  props: ['state'],
  mixins: [BaseInputMixin],
  components: {
    'baseinput': BaseInput
  },
  created() {
    this.service = new InputServices[this.state.input.type]({
      state: this.state,
    });
    //if required validate it
    this.state.validate.required && this.service.validate();
    this.$emit('addinput', this.state);
  }
};

module.exports = Input;
