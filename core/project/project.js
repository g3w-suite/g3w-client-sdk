var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var GeoLayer = require('core/layers/geolayer');
var LayersStore = require('core/layers/layersstore');
var LayersStoresRegistry = require('core/layers/layersstoresregistry');
var Projections = require('core/geo/projections');

function Project(projectConfig) {
  var self = this;
  /* struttura oggetto 'project'
  {
    id,
    type,
    gid,
    name,
    crs,
    proj4,
    extent,
    initextent,
    layers,
    layerstree,
    overviewprojectgid,
    baselayers,
    initbaselayer
  }
  */
  this.state = projectConfig;

  this._processLayers();

  this._projection = Projections.get(this.state.crs,this.state.proj4);
  this._layersStore = this._buildLayersStore();
  LayersStoresRegistry.addLayersStore(this._layersStore);

  this.setters = {
    setBaseLayer: function(id) {
      _.forEach(self.state.baselayers, function(baseLayer) {
        baseLayer.visible = (baseLayer.id == id || (baseLayer.fixed === true));
      })
    }
  };

  base(this);
}

inherit(Project, G3WObject);

var proto = Project.prototype;

proto._processLayers = function() {
  var self = this;
  function traverse(obj) {
    _.forIn(obj, function (layer, key) {
      //verifica che il nodo sia un layer e non un folder
      if (!_.isNil(layer.id)) {
        var fulllayer;
        _.forEach(self.state.layers, function(lyr) {
          if (layer.id == lyr.id) {
            lyr.wmsUrl = self.getWmsUrl();
            lyr.project = self;
            fulllayer = _.merge(lyr, layer);
            return false
          }
        });
        obj[parseInt(key)] = fulllayer;
      }
      if (!_.isNil(layer.nodes)){
        // aggiungo proprietà title per l'albero
        layer.title = layer.name;
        traverse(layer.nodes);
      }
    });
  }
  traverse(this.state.layerstree);

  _.forEach(this.state.baselayers, function(layerConfig) {
    var visible = false;

    if (self.state.initbaselayer) {
      visible = (layerConfig.id == (self.state.initbaselayer));
    }

    if (layerConfig.fixed) {
      visible = layerConfig.fixed;
    }

    layerConfig.visible = visible;
    layerConfig.baselayer = true;
  });
};

proto._buildLayersStore = function() {
  var layersStore = new LayersStore();

  layersStore.setOptions({
    id: this.state.gid,
    projection: this._projection,
    extent: this.state.extent,
    initextent: this.state.initextent,
    wmsUrl: this.state.WMSUrl
  });

  _.forEach(this.getLayers(), function(layerConfig) {
    // aggiungo la proiezione
    layerConfig.projection = this._projection;
    var layer = new GeoLayer(layerConfig);
    layersStore.addLayer(layer);
  });

  layersStore.setLayersTree(this.getLayersTree(),this.state.name);

  return layersStore;
};

proto.getLayers = function() {
  return _.concat(this.state.layers,this.state.baselayers);
};

proto.getState = function() {
  return this.state;
};

// funzione che ritorna id
proto.getId = function() {
  return this.state.id;
};

//funzione che ritorna il tipo
proto.getType = function() {
  return this.state.type;
};

proto.getGid = function() {
  return this.state.gid;
};

proto.getName = function() {
  return this.state.name;
};

proto.getOverviewProjectGid = function() {
  return this.state.overviewprojectgid ? this.state.overviewprojectgid.gid : null;
};

proto.getCrs = function() {
  return this._projection.getCode();
};

proto.getProjection = function() {
  return this._projection;
};

proto.getWmsUrl = function() {
  return this.state.WMSUrl;
};

proto.getInfoFormat = function() {
  return 'application/vnd.ogc.gml';
};

proto.getLayersTree = function(full) {
  if (full === true) {
    return this.state.layerstree;
  }
  else {
    var layerstree = [];
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
    traverse(this.state.layerstree,layerstree);
    return layerstree;
  }

};

proto.getLayersStore = function() {
  return this._layersStore;
};

module.exports = Project;
