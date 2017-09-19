var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function LayersStoresRegistry() {
  var self = this;
  this.stores = {};
  this.storesArray = [];
  // questi setters mi servono per far reagire  le varie parti dell'applicazione
  // che dipendono o sono legate ai layersStores
  this.setters = {
    addLayersStore: function(layersStore, idx) {
      this._addLayersStore(layersStore, idx);
    },
    removeLayersStore: function(layerStore) {
      this._removeLayersStore(layerStore);
    },
    removeLayersStores: function() {
      this._removeLayersStores();
    }
  };

  base(this);
}

inherit(LayersStoresRegistry, G3WObject);

proto = LayersStoresRegistry.prototype;

proto.getLayers = function(filter) {
  var layers = [];
  _.forEach(this.stores, function(layersStore, storeId) {
    layers = layers.concat(layersStore.getLayers(filter))
  });
  return layers;
};

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

// funzione che aggiunge un layersstore al registro della
proto._addLayersStore = function(layersStore, idx) {
  // usiamo un array per garantire ordine di inserimento, poi potremo gestire richieste di inserimento in una specifica posizione
  var storeId = layersStore.getId();
  this.stores[storeId] = layersStore;
  if (!_.isNil(idx)) {
    this.storesArray.splice(idx,0, storeId);
  } else {
    this.storesArray.push(storeId);
  }
};

proto._removeLayersStore = function(layerStore) {
  if (layerStore) {
    var storeId = layerStore.getId();
    var idx = this.storesArray.indexOf(storeId);
    delete this.stores[storeId];
    this.storesArray.splice(idx, 1);
  }
};

// rimuove tutti i layersstore salvati
proto._removeLayersStores = function() {
  var length = this.storesArray.length;
  this.storesArray.splice(0, length);
  this.stores = {};
};


module.exports = LayersStoresRegistry;