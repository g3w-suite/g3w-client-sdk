var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var resolve = require('core/utils/utils').resolve;
var BaseComponent = require('gui/component');
// classe componente
var Component = function(options) {
  base(this, options);
};
// eredita le caratteristiche del componente base
inherit(Component, BaseComponent);

//prototype
var proto = Component.prototype;
// viene richiamato dalla toolbar o da qualsiasi parte per montare il componente vue su un particolare elemento dom padre
// quando il plugin chiede di mostrare un proprio pannello nella GUI (GUI.showPanel)
proto.mount = function(parent, append) {
  // verifica che sia stato settato il componente interno
  if (!this.internalComponent) {
    this.setInternalComponent();
  }
  // verifica se è in append o no
  if(append) {
    this.internalComponent.$mount().$appendTo(parent);
  }
  else {
    this.internalComponent.$mount(parent);
  }
  $(parent).localize();
  // risolve la promessa
  return resolve(true);
};
// richiamato quando la GUI chiede di chiudere il pannello. Se ritorna false il pannello non viene chiuso
proto.unmount = function() {
  // il problema che distruggere
  this.internalComponent.$destroy(true);
  // lo setta di nuovo a null
  this.internalComponent = null;
  return resolve();
};
// funzione che verifica se il componente interno è montato
proto.ismount = function() {
  return this.internalComponent && this.internalComponent.$el;
};

proto.layout = function(width,height) {
  if (this.internalComponent) {
    this.internalComponent.$broadcast('layout');
  }
};
module.exports = Component;
