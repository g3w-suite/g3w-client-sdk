var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function LayersStore(config) {
  var self = this;
  config = config || {};
  this.config = {
    id: config.id || Date.now(),
    projection: config.projection,
    extent: config.extent,
    initextent: config.initextent,
    wmsUrl: config.wmsUrl
  };

  this.state = {
    layerstree: []
  };

  this._layers = this.config.layers || {};

  this.setters = {
    setLayersVisible: function (layersIds, visible) {
      var self = this;
      _.forEach(layersIds, function (layerId) {
        self.getLayerById(layerId).state.visible = visible;
      })
    },
    setLayerSelected: function(layerId, selected) {
      var layers = this.getLayers();
      _.forEach(layers, function(layer) {
        layer.state.selected = ((layerId == layer.getId()) && selected) || false;
      })
    },
    addLayer: function(layer) {
      this._addLayer(layer);
    },
    removeLayer: function(layerId) {
      this._removeLayer(layerId);
    }
  };

  base(this);
}

inherit(LayersStore, G3WObject);

proto = LayersStore.prototype;

proto.setOptions = function(config) {
  this.config = config;
};

proto.getId = function() {
  return this.config.id;
};

proto._addLayer = function(layer) {
  this._layers[layer.getId()] = layer;
};

proto.addLayers = function(layers) {
  var self = this;
  _.forEach(layers, function(layer) {
    self.addLayer(layer);
  });
};

proto._removeLayer = function(layerId) {
  delete this._layers[layerId];
};

proto.removeLayers = function(layersId) {
  _.forEach(layersId, function(layerId) {
    self.removeLayer(layer)
  })
};

proto.getLayersDict = function(options) {
  if (!options) {
    return this._layers;
  }
  var options = options || {};
  var filterActive = options.ACTIVE;
  var filterQueryable = options.QUERYABLE;
  var filterVisible = options.VISIBLE;
  var filterSelected = options.SELECTED;
  var filterCached = options.CACHED;
  var filterSelectedOrAll = options.SELECTEDORALL;
  var filterAllNotSelected = options.ALLNOTSELECTED;
  var filterServerType = options.SERVERTYPE;
  var filterBaseLayer = options.BASELAYER || false;
  var filterWfs = options.WFS;
  if (filterSelectedOrAll) {
    filterSelected = null;
  }
  if (_.isUndefined(filterQueryable)
    && _.isUndefined(filterVisible)
    && _.isUndefined(filterActive)
    && _.isUndefined(filterSelected)
    && _.isUndefined(filterCached)
    && _.isUndefined(filterSelectedOrAll)
    && _.isUndefined(filterServerType)
    && _.isUndefined(filterBaseLayer)) {
    return this._layers;
  }
  var layers = [];
  _.forEach(this._layers, function(layer, key) {
    layers.push(layer);
  });


  if (typeof filterActive == 'boolean') {
    layers = _.filter(layers, function(layer) {
      return filterActive == !layer.isDisabled();
    });
  }

  if (typeof filterQueryable == 'boolean') {
    layers = _.filter(layers, function(layer) {
      return filterQueryable == layer.isQueryable();
    });
  }

  if (typeof filterVisible == 'boolean') {
    layers = _.filter(layers,function(layer){
      return filterVisible == layer.isVisible();
    });
  }

  if (typeof filterCached == 'boolean') {
    layers = _.filter(layers,function(layer){
      return filterCached == layer.isCached();
    });
  }

  if (typeof filterSelected == 'boolean') {
    layers = _.filter(layers,function(layer){
      return filterSelected == layer.isSelected();
    });
  }

  if (typeof filterBaseLayer == 'boolean') {
    layers = _.filter(layers,function(layer){
      return filterBaseLayer == layer.isBaseLayer();
    });
  }

  if (typeof filterServerType == 'string' && filterServerType!='') {
    layers = _.filter(layers,function(layer){
      return filterServerType = layer.getServerType();
    });
  }
  // filtra solo i selezionati
  if (filterSelectedOrAll) {
    var _layers = layers;
    layers = _.filter(layers,function(layer){
      return layer.isSelected();
    });
    layers = layers.length ? layers : _layers;
  }

  // filtra solo i quelli non selezionati
  if (filterAllNotSelected) {
    var _layers = layers;
    layers = _.filter(layers,function(layer){
      return !layer.isSelected();
    });
    layers = layers.length ? layers : _layers;
  }

  // filtra solo i quelli wfs
  if (filterWfs) {
    layers = _.filter(layers,function(layer) {
      // specifico che deve evare lo stesso crs del progetto
      return layer.getWfsCapabilities() && layer.config.crs == 3003;
    });
  }

  return layers;
};

// ritorna l'array dei layers (con opzioni di ricerca)
proto.getLayers = function(options) {
  var layers = this.getLayersDict(options);
  return _.values(layers);
};

proto.getBaseLayers = function() {
  return this.getLayersDict({
    BASELAYER: true
  });
};

proto.getLayerById = function(layerId) {
  return this.getLayersDict()[layerId];
};

proto.getLayerByName = function(name) {
  var layer = null;
  _.forEach(this.getLayersDict(),function(layer){
    if (layer.getName() == name){
      layer = _layer;
    }
  });
  return layer;
};

proto.getLayerAttributes = function(layerId){
  return this.getLayerById(layerId).getAttributes();
};

proto.getLayerAttributeLabel = function(layerId,name){
  return this.getLayerById(layerId).getAttributeLabel(name);
};

proto.toggleLayer = function(layerId,visible){
  var layer = this.getLayerById(layerId);
  var visible = visible || !layer.state.visible;
  this.setLayersVisible([layerId],visible);
};

proto.toggleLayers = function(layersIds,visible){
  this.setLayersVisible(layersIds,visible);
};

proto.selectLayer = function(layerId){
  this.setLayerSelected(layerId, true);
};

proto.unselectLayer = function(layerId) {
  this.setLayerSelected(layerId, false);
};

proto.getProjection = function() {
  return this.config.projection;
};

proto.getExtent = function() {
  return this.config.extent;
};

proto.getInitExtent = function() {
  return this.config.initextent;
};

proto.getWmsUrl = function() {
  return this.config.wmsUrl;
};

proto.setLayersTree = function(layerstree,name) {
  var self = this;
  function traverse(obj) {
    _.forIn(obj, function (layer, key) {
      //verifica che il nodo sia un layer e non un folder
      if (!_.isNil(layer.id)) {
        obj[key] = self.getLayerById(layer.id).getState();
      }
      if (!_.isNil(layer.nodes)){
        traverse(layer.nodes);
      }
    });
  }
  traverse(layerstree);

  this.state.layerstree.splice(0,0,{
    title: name || this.config.id,
    expanded: true,
    nodes: layerstree
  });
};

proto.removeLayersTree = function(id){
  this.state.layerstree.splice(0,this.state.layerstree.length);
};

proto.getLayersTree = function(id) {
  return this.state.layerstree;
};

module.exports = LayersStore;
