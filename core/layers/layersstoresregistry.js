var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var LayersStore = require('core/layers/layersstore');

// Interfaccia per registare i layers
function LayersStoresRegistry() {
  var self = this;

  this.defaultStore = new LayersStore();
  this.stores = {
    'default': this.defaultStore
  };

  base(this);
}

inherit(LayersStoresRegistry, G3WObject);

proto = LayersStoresRegistry.prototype;

proto.getLayersStore = function(id) {
  return id ? this.stores[id] : this.defaultStore;
};

module.exports = new LayersStoresRegistry();