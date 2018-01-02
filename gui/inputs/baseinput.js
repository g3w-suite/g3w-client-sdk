// oggetto base per che definisce i metodi comuni per tutti gli inputs
const Service = require('./service');
//Definisco un baseInput object per permetterere all'input di ereditare
// metododi etc .. da questo
const BaseInput = {
  props: ['state'],
  data: function() {
    return {
      // definisco il service per chi non lo sovrascrive
      service: new Service({
        state: this.state // passo lo state
      })
    }
  },
  template: require('./baseinput.html'),
  methods: {
    // metodo che viene scaturito quando cambia il valore dell'input
    change: function(options) {
      //vado a validare il valore
      this.service.validate(options);
      // emette il segnale che è cambiato un input
      this.$emit('changeinput', this.state);
    },
    isEditable: function() {
      return this.service.isEditable();
    },
    isVisible: function() {

    }
  },
  // vado a emettere l'evento addinput
  mounted: function() {
    // setto la proprietà reattiva valid
    Vue.set(this.state.validate, 'valid', true);
    Vue.set(this.state.validate, 'message', null);
    this.change();
    this.$nextTick(() => {
      // emetto il segnale di aggiunta input e passo l'oggetto validate
      this.$emit('addinput', this.state);
    })
  }
};

//vado a definire un componente BaseInput che sarà parte del componente input
const BaseInputComponent = Vue.extend({
  mixins: [BaseInput]
});


module.exports = {
  BaseInput: BaseInput,
  BaseInputComponent: BaseInputComponent
};
