const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ProjectsRegistry = require('core/project/projectsregistry');
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');

function CatalogService() {
  this.state = {
    prstate: ProjectsRegistry.state,
    highlightlayers: false,
    externallayers:[],
    layerstrees: []
  };
  this.setters = {};
  this.addExternalLayer = function(layer) {
    this.state.externallayers.push(layer);
  };
  this.removeExternalLayer = function(name) {
    this.state.externallayers.forEach((layer, index) => {
      if (layer.name == name) {
        this.state.externallayers.splice(index, 1);
        return false
      }
    });
  };

  this.addLayersStoreToLayersTrees = function(layersStore) {
    this.state.layerstrees.push({
      tree: layersStore.getLayersTree(),
      storeid: layersStore.getId()
    });
  };

  base(this);
  const layersStores = CatalogLayersStoresRegistry.getLayersStores();
  layersStores.forEach((layersStore) => {
    this.addLayersStoreToLayersTrees(layersStore);
  });

  CatalogLayersStoresRegistry.onafter('addLayersStore', (layersStore) => {
    this.addLayersStoreToLayersTrees(layersStore);
  });

  CatalogLayersStoresRegistry.onafter('removeLayersStore', (layersStore) => {
    this.state.layerstrees.forEach((layersTree, idx) => {
      if (layersTree.storeid == layersStore.getId()) {
        this.state.layerstrees.splice(idx, 1);
        return false;
      }
    });
  });
  CatalogLayersStoresRegistry.onafter('removeLayersStores', () => {
    this.state.layerstrees.forEach((layersTree, idx) => {
      this.state.layerstrees.splice(idx, 1);
      return false;
    });
  });
}

inherit(CatalogService, G3WObject);

module.exports = CatalogService;
