const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

// Registy Layers
function LayersStoresRegistry() {
  this.stores = {};
  this.storesArray = [];
  // to react some application components that are binding to Layerstore
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

const proto = LayersStoresRegistry.prototype;

proto.getLayers = function(filter) {
  let layers = [];
  Object.entries(this.stores).forEach(([storeId, layersStore]) => {
    layers = layers.concat(layersStore.getLayers(filter))
  });
  return layers;
};

proto.getQuerableLayersStores = function() {
  return this.getLayersStores().filter((layersStore) => {
    return layersStore.isQueryable();
  })
};

proto.getLayersStore = function(id) {
  return this.stores[id];
};

proto.getLayersStores = function() {
  const stores = [];
  this.storesArray.forEach((storeId) => {
    stores.push(this.stores[storeId]);
  });
  return stores;
};

proto._addLayersStore = function(layersStore, idx) {
  const storeId = layersStore.getId();
  this.stores[storeId] = layersStore;
  if (!_.isNil(idx)) {
    this.storesArray.splice(idx,0, storeId);
  } else {
    this.storesArray.push(storeId);
  }
};

proto._removeLayersStore = function(layerStore) {
  if (layerStore) {
    const storeId = layerStore.getId();
    this.storesArray = this.storesArray.filter((_storeId) => _storeId != storeId);
    delete this.stores[storeId];

  }
};

proto._removeLayersStores = function() {
  this.storesArray = [];
  this.stores = {};
};


module.exports = LayersStoresRegistry;
