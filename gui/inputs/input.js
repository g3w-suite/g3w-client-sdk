const BaseInput = require('./baseinput').BaseInput;
const BaseInputComponent= require('./baseinput').BaseInputComponent;
const Input = {
  props: ['state'],
  mixins: [BaseInput], // eredito dall'oggetto BaseInput
  components: {
    baseinput: BaseInputComponent // definisco il componente BaseInput che mi servirà poi
                                  // come base per modificare la label e l'input element
  }
};

module.exports = Input;
