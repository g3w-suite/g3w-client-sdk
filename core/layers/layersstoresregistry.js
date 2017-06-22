var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var LayersStore = require('core/layers/layersstore');

// Interfaccia per registare i layers
function LayersStoresRegistry() {
  var self = this;

  this.stores = {};
  this.storesArray = [];

  base(this);
}

inherit(LayersStoresRegistry, G3WObject);

proto = LayersStoresRegistry.prototype;

proto.getLayersStore = function(id) {
  return this.stores[id];
};

proto.getLayersStores = function() {
  var self = this;
  var stores = [];

  _.forEach(this.storesArray,function(storeId){
    stores.push(self.stores[storeId]);
  });

  return stores;
};

proto.addLayersStore = function(layerStore) {
  // usiamo un array per garantire ordine di inserimento, poi potremo gestire richieste di inserimento in una specifica posizione
  var storeId = layerStore.getId();
  this.stores[storeId] = layerStore;
  this.storesArray.push(storeId);
};

module.exports = new LayersStoresRegistry();