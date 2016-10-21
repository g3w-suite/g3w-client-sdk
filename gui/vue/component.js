var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var BaseComponent = require('gui/component');

var Component = function(options) {
  base(this,options);
};

inherit(Component, BaseComponent);

var proto = Component.prototype;

// viene richiamato dalla toolbar o da qualsiasi parte per montare il componente vuie su un particolare oggetto dom padre
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
  // risolve
  return resolve(true);
};

// richiamato quando la GUI chiede di chiudere il pannello. Se ritorna false il pannello non viene chiuso
proto.unmount = function() {
  // il problema che distruggere
  this.internalComponent.$destroy(true);
  this.internalComponent = null;
  return resolve();
};

proto.ismount = function() {
  return this.internalComponent && this.internalComponent.$el;
};

proto.hide = function() {
  console.log(this.internalComponent.$el);
};

module.exports = Component;
