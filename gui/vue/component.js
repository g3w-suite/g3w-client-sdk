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
  var self = this;
  var d = $.Deferred();
  // verifica che sia stato settato il componente interno
  if (!this.internalComponent) {
    this.setInternalComponent();
  }
  // verifica se è in append o no
  if (append) {
    var iCinstance = this.internalComponent.$mount();
    $(parent).append(iCinstance.$el);
  }
  else {
    this.internalComponent.$mount(parent);
  }
  //return resolve(true);
  Vue.nextTick(function(){
    $(parent).localize();
    // risolve la promessa
    d.resolve(true);
  });
  return d.promise();
};
// richiamato quando la GUI chiede di chiudere il pannello. Se ritorna false il pannello non viene chiuso
proto.unmount = function() {
  // il problema che distruggere
  if (_.isNil(this.internalComponent)) {
    var a = 1;
    return resolve();
  }
  this.internalComponent.$destroy(true);
  $(this.internalComponent.$el).remove();
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
    //this.internalComponent.$broadcast('layout');
  }
};
module.exports = Component;
