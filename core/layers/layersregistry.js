var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Layer = require('core/layers/layer');

// Interfaccia per registare i layers
function LayersRegistry() {
  
  this._config = null;
  this._layers = {};
  this._layerstree = null;
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
        layer.state.selected = ((layerId == layer.state.id) && selected) || false;
      })
    }
  };

  base(this);
}

inherit(LayersRegistry, G3WObject);

proto = LayersRegistry.prototype;

// funzione di inzializzazione del registro dei layers
proto.init = function(config) {
  var self = this;
  // setto la configurazione passata dal project registry
  this._config = config;
  this._layerstree = config.layerstree;
  function traverse(obj) {
    _.forIn(obj, function (layerConfig, key) {
      //verifica che il valore dell'id non sia nullo
      if (!_.isNil(layerConfig.id)) {
        //costruisco il project layer per ogni layer
        layerConfig.wmsUrl = config.WMSUrl;
        var layer = self.buildLayer(layerConfig);
        self._layers[layer.getId()] = layer;
      }
      if (!_.isNil(layerConfig.nodes)) {
        traverse(layerConfig.nodes);
      }
    });
  }
  traverse(this._layerstree);
};

proto.setProject = function(project) {
  this._project = project;
};

proto.getProject = function() {
  return this._project;
};

proto.getLayersTree = function() {
  return this._layerstree;
};

proto.getLayers = function() {
  return this._layers;
};

proto.buildLayer = function(layerConfig) {
  var layer = new Layer(layerConfig);
  // aggiungo proprietà non ottenute dalla consfigurazione
  layer.state.selected = false;
  layer.state.disabled = false;
  return layer;
};

proto.getLayersDict = function(options) {
  var self = this;
  var options = options || {};
  var filterActive = options.ACTIVE;
  var filterQueryable = options.QUERYABLE;
  var filterVisible = options.VISIBLE;
  var filterSelected = options.SELECTED;
  var filterSelectedOrAll = options.SELECTEDORALL;
  var filterAllNotSelected = options.ALLNOTSELECTED;
  var filterWfs = options.WFS;
  if (filterSelectedOrAll) {
    filterSelected = null;
  }
  if (_.isUndefined(filterQueryable) && _.isUndefined(filterVisible) && _.isUndefined(filterActive) && _.isUndefined(filterSelected) && _.isUndefined(filterSelectedOrAll)) {
    return this._layers;
  }
  var layers = [];
  _.forEach(this._layers, function(layer, key) {
    layers.push(layer);
  });


  if (filterActive) {
    layers = _.filter(layers, function(layer) {
      return filterActive && !layer.isDisabled();
    });
  }

  if (filterQueryable) {
    layers = _.filter(layers, function(layer) {
      return filterQueryable && layer.isQueryable();
    });
  }

  if (filterVisible) {
    layers = _.filter(layers,function(layer){
      return filterVisible && layer.isVisible();
    });
  }

  if (filterSelected) {
    layers = _.filter(layers,function(layer){
      return filterSelected && layer.isSelected();
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
      return layer.getWfsCapabilities() && layer.state.crs == self._project.getCrs();
    });
  }

  return layers;
};

// ritorna l'array dei layers (con opzioni di ricerca)
proto.getLayers = function(options) {
  var layers = this.getLayersDict(options);
  return _.values(layers);
};

proto.getLayerById = function(layerId) {
  return this.getLayersDict()[layerId];
};

proto.getLayerByName = function(name) {
  var layer = null;
  _.forEach(this.getLayers(),function(layer){
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
  this.setLayerSelected(layerId,true);
};

proto.unselectLayer = function(layerId) {
  this.setLayerSelected(layerId,false);
};

module.exports = new LayersRegistry();
