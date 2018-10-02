const BaseInput = require('./baseinput/baseinput').BaseInput;
const BaseInputComponent= require('./baseinput/baseinput').BaseInputComponent;
const Input = {
  props: ['state'],
  mixins: [BaseInput],
  components: {
    baseinput: BaseInputComponent
  }
};

module.exports = Input;
