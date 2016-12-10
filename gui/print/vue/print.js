var inherit = require('core/utils/utils').inherit;
var Component = require('gui/vue/component');
var PrintService = require('gui/print/printservice');
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;

var vueComponentOptions = {
  template: require('./print.html'),
  data: function() {
    var self = this;
    return {
      state: null,
      buttons: [
        {
          title: "Crea PDF",
          class: "btn-success",
          type:"stampa",
          cbk: function() {
            self.print()
          }
        }
      ]
    }
  },
  methods: {
    exec: function(cbk) {
      cbk();
    },
    isAnnullaButton: function(type) {
      return type == 'annulla'
    },
    // metodo per il cambio di template
    onChangeTemplate: function() {
      this.$options.service.changeTemplate();
    },
    // metodo per il cambio di scala
    onChangeScale: function() {
      this.$options.service.changeScale()
    },
    // metodo per il cambio di rotazione
    onChangeRotation: function(evt) {
      if (this.state.rotation >= 0 && !_.isNil(this.state.rotation) && this.state.rotation != '') {
        this.state.rotation = (this.state.rotation > 360) ? 360 : this.state.rotation;
        evt.target.value = this.state.rotation;
      } else if (this.state.rotation < 0) {
        this.state.rotation = (this.state.rotation < -360) ? -360 : this.state.rotation;
        evt.target.value = this.state.rotation;
      } else {
        this.state.rotation = 0;
      }

      this.$options.service.changeRotation();
    },
    // lancia il print
    print: function() {
      this.$options.service.print();
    },
    // metodo per la visualizzazione dell'area grigia o meno
    showPrintArea: function() {
      this.$options.service.showPrintArea();
    }
  }
};


function PrintComponent(options) {
  // proprietà necessarie. In futuro le mettermo in una classe Panel
  // da cui deriveranno tutti i pannelli che vogliono essere mostrati nella sidebar
  base(this, options);
  this.title = "print";
  // qui vado a tenere traccia delle due cose che mi permettono di customizzare
  // vue component e service
  this.vueComponent = vueComponentOptions;
  merge(this, options);
  // dichiaro l'internal Component
  this.internalComponent = null;
  // settor il service del component
  this._service = options.service || new PrintService;
  // setto il componente interno
  this.setInternalComponent = function () {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      service: this._service
    });
    // faccio il merge tra lo state del service e quello del componente
    this._service.state = _.merge(this.state, this._service.state);
    // assegno all'internal compoent lo state mergiato
    this.internalComponent.state = this._service.state;
    return this.internalComponent;
  };

}

inherit(PrintComponent, Component);

module.exports = PrintComponent;


