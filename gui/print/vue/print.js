var inherit = require('core/utils/utils').inherit;
var Component = require('gui/vue/component');
var PrintService = require('gui/print/printservice');
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var config = require('./config');
var scale = config.scale;
var dpis= config.dpis;

var vueComponentOptions = {
  template: require('./print.html'),
  data: function() {
    var self = this;
    return {
      state: null,
      dpis: dpis,
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

    },
    // metodo per il cambio di scala
    onChangeScale: function(evt) {
      var value = evt.target.value;
      this.$options.service.changeScale(value)
    },
    // metodo per il cambio di rotazione
    onChangeRotation: function(evt) {
      var rotation = evt.target.value;
      rotation = (rotation > 360) ? 360: rotation;
      evt.target.value = rotation;
      this.$options.service.changeRotation(rotation);
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
    this.internalComponent.state = _.merge(this.state, this._service.state);
    this.internalComponent.state.scale = scale;
    this.internalComponent.state.scala = 5000;
    this._service.state.scala = 5000;
    return this.internalComponent;
  };

}

inherit(PrintComponent, Component);

module.exports = PrintComponent;


