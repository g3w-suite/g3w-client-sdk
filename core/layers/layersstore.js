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
    wmsUrl: config.wmsUrl,
    //metto caratteristica catalogabile
    catalog: _.isBoolean(config.catalog) ? config.catalog : true
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

proto.showOnCatalog = function() {
  return this.config.catalog;
};

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
  var filterFilterable = options.FILTERABLE;
  var filterEditable = options.EDITABLE;
  var filterVisible = options.VISIBLE;
  var filterSelected = options.SELECTED;
  var filterCached = options.CACHED;
  var filterSelectedOrAll = options.SELECTEDORALL;
  var filterAllNotSelected = options.ALLNOTSELECTED;
  var filterServerType = options.SERVERTYPE;
  var filterBaseLayer = options.BASELAYER || false;
  var filterGeoLayer = options.GEOLAYER;
  var filterHidden = options.HIDDEN;
  var filterWfs = options.WFS;
  if (filterSelectedOrAll) {
    filterSelected = null;
  }
  if (_.isUndefined(filterQueryable)
    && _.isUndefined(filterFilterable)
    && _.isUndefined(filterEditable)
    && _.isUndefined(filterVisible)
    && _.isUndefined(filterActive)
    && _.isUndefined(filterSelected)
    && _.isUndefined(filterCached)
    && _.isUndefined(filterSelectedOrAll)
    && _.isUndefined(filterServerType)
    && _.isUndefined(filterGeoLayer)
    && _.isUndefined(filterHidden)
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

  if (typeof filterFilterable == 'boolean') {
    layers = _.filter(layers,function(layer) {
      return filterFilterable == layer.isFilterable();
    });
  }

  if (typeof filterEditable == 'boolean') {
    layers = _.filter(layers,function(layer) {
      return filterEditable == layer.isEditable();
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

  if (typeof filterGeoLayer == 'boolean') {
    layers = _.filter(layers,function(layer) {
      return filterGeoLayer == layer.state.geolayer;
    });
  }

  if (typeof filterHidden == 'boolean') {
    layers = _.filter(layers,function(layer){
      return filterHidden == layer.isHidden();
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

proto.getGeoLayers = function() {
  return this.getLayers({
    GEOLAYER: true
  })
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

// funzione che setta il layersstree deli layers del layersstore
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

  // questo server per raggruppare ogni albero dei layer
  // al proprio gruppo che sia un progetto, un plugin o altro
  // quando viene creato il layersstore
  this.state.layerstree.splice(0,0,{
    title: name || this.config.id,
    expanded: true,
    nodes: layerstree
  });
};

// funzione che posso sfruttare dai plugin per costruire un
// layerstree senza tanto stare acreare  e ricordarmi come creare un layerstrree
// naturalmente è ad una dimanesione altrimenti c'è da studiare
// come creare un layers tree cosa innestata forse paasando un layertree nella configurazione
proto.createLayersTree = function(groupName, options) {
  var options = options || {};
  var full = options.full || false;
  var _layerstree = options.layerstree || null;
  var layerstree = [];
  if (_layerstree) {
    if (full === true) {
      return this.state.layerstree;
    }
    else {
      function traverse(obj,newobj) {
        _.forIn(obj, function (layer) {
          var lightlayer = {};
          if (!_.isNil(layer.id)) {
            lightlayer.id = layer.id;
          }
          if (!_.isNil(layer.nodes)){
            lightlayer.title = layer.name;
            lightlayer.expanded = layer.expanded;
            lightlayer.nodes = [];
            traverse(layer.nodes,lightlayer.nodes)
          }
          newobj.push(lightlayer);
        });
      }
      traverse(_layerstree,layerstree);
    }
  } else {
    _.forEach(this.getGeoLayers(), function (layer) {
      layerstree.push({
        id: layer.getId(),
        name: layer.getName(),
        title: layer.getTitle(),
        visible: layer.isVisible() || false
      })
    });
  }  
  this.setLayersTree(layerstree, groupName);
};

proto.removeLayersTree = function(id) {
  this.state.layerstree.splice(0,this.state.layerstree.length);
};

proto.getLayersTree = function(id) {
  return this.state.layerstree;
};

module.exports = LayersStore;
