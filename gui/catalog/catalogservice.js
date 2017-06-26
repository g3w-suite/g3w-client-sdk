var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');
var LayersStoresRegistry = require('core/layers/layersstoresregistry');

function CatalogService() {
  var self = this;
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
    var self = this;
    _.forEach(this.state.externallayers, function(layer, index) {
      if (layer.name == name) {
        self.state.externallayers.splice(index, 1);
        return false
      }
    });
  };

  // funzione che verifica se il layerssore aggiunto è addatttao per essere aggiunto
  // al layerstrees del catalogo e quindi visibile come albero dei layer
  this.addLayersStoreToLayersTrees = function(layersStore) {
    this.state.layerstrees.push({
      tree: layersStore.getLayersTree(),
      storeid: layersStore.getId()
    });
  };

  base(this);
  // vado a popolare cosa c'è già
  var layersStores = LayersStoresRegistry.getLayersStores();
  _.forEach(layersStores, function(layersStore) {
    self.addLayersStoreToLayersTrees(layersStore);
  });

  // resto in ascolto di eventuali layersStore aggiunti
  LayersStoresRegistry.onafter('addLayersStore', function(layersStore) {
    self.addLayersStoreToLayersTrees(layersStore);
  });

  //registro l'eventuale rimozione del layersSore dal LayersRegistryStore
  LayersStoresRegistry.onafter('removeLayersStore', function(layersStore) {
    _.forEach(self.state.layerstrees, function(layersTree, idx) {
      if (layersTree.storeid == layersStore.getId()) {
        self.state.layerstrees.splice(idx, 1);
        return false;
      }
    });

  });
}

inherit(CatalogService, G3WObject);

module.exports = CatalogService;
