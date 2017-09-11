// oggetto base per che definisce i metodi comuni per tutti gli inputs
var Service = require('./service');
var Input = {
  props: ['state'],
  data: function() {
    return {
      // definisco il service per chi non lo sovrascrive
      service: new Service({
        state: this.state // passo lo state
      })
    }
  },
  template: require('./input.html'),
  methods: {
    // metodo che viene scaturito quando cambia il valore dell'input
    change: function() {
      //vado a validare il valore
      this.service.validate();
      // emette il segnale che è cambiato un input
      this.$emit('changeinput');
    },
    isEditable: function() {
      return this.service.isEditable();
    },
    isVisible: function() {

    }
  },
  // vado a emettere l'evento addinput
  mounted: function() {
    var self = this;
    // setto la proprietà reattiva valid
    Vue.set(this.state.validate, 'valid', true);
    Vue.set(this.state.validate, 'message', null);
    this.change();
    this.$nextTick(function() {
      // emetto il segnale di aggiunta input e passo l'oggetto validate
      self.$emit('addinput', this.state.validate);
    })
  }
};

module.exports = Input;