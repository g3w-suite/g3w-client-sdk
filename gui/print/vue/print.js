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
      button: {
        title: "Crea PDF",
        class: "btn-success",
        type:"stampa",
        disabled: false,
        cbk: function() {
          self.print()
        }
      }
    }
  },
  methods: {
    exec: function(cbk) {
      cbk();
    },
    btnEnabled: function(button) {
      return button.disabled;
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
    // lfunzione dedicata alla visualizzazione dell'ouput del print
    print: function() {
      this.$options.service.print();
    },
    // metodo per la visualizzazione dell'area grigia o meno
    showPrintArea: function() {
      this.$options.service.showPrintArea();
    }
  },
  ready: function() {
    var self = this;
    this.$options.service.on('showpdf', function(bool) {
      self.button.disabled = bool;
    })
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
  // setto il service del component (istanzio il nuovo servizio)
  var service = options.service || new PrintService;
  this.setService(service);
  // setto il componente interno
  this.setInternalComponent = function () {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      service: service
    });
    // setto la visibilità del print in base a quella del servizio calcolata sull'array
    // print restituita dal server
    this.state.visible = service.state.visible;
    // assegno all'internal componente lo state mergiato
    this.internalComponent.state = service.state;
    // ritorno l'internal component
    return this.internalComponent;
  };

}

inherit(PrintComponent, Component);

module.exports = PrintComponent;


