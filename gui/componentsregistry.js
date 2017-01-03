var G3WObject = require('core/g3wobject');
var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;

//classe Componet Registry (singleton)
// ha lo scopo di salvare tutti i componenti aggiunti
function ComponentsRegistry() {
  // attributo componets che tiene traccia
  // dei componenti registrati
  this.components = {};
  // funzione per refgistrare il componente
  this.registerComponent = function(component) {
    // recupera l'id del componente
    var id = component.getId();
    // se non è stato precedentemente registrato
    if (!this.components[id]) {
      this.components[id] = component;
      this.emit('componentregistered', component);
    }
  }; 
  //funzione che retituisce il componente in base all'id
  this.getComponent = function(id) {
    return this.components[id];
  };
  // toglie dal registro dei componenti il componete che si vuole eliminare
  this.unregisterComponent = function(id) {
    var component = this._components[id];
    // verifica che sia presente il componete con l'id passato
    if (component) {
      //verifico che estista la funzione destroy dell'oggetto componente
      if (_.isFunction(component.destroy)) {
        // nel caso lo ditruggo (togliendolo anche visivamente)
        component.destroy();
      }
      //elimino il componente e lo setto a null per evitare
      // che se in un secondo momento lo registro di nuovo
      // questa venga ignorato
      delete component;
      this._components[id] = null;
    }
  };
  base(this);
}
inherit(ComponentsRegistry,G3WObject);

module.exports = new ComponentsRegistry;
