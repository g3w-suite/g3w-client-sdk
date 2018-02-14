const BaseInput = require('./baseinput').BaseInput;
const BaseInputComponent= require('./baseinput').BaseInputComponent;
const Input = {
  props: ['state'],
  mixins: [BaseInput],
  components: {
    baseinput: BaseInputComponent 
  }
};

module.exports = Input;
