const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const LayerFactory = require('core/layers/layerfactory');
const LayersStore = require('core/layers/layersstore');
const Projections = require('g3w-ol3/src/projection/projections');

function Project(projectConfig) {
  /* structure 'project' object
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
  // proess layers
  this._processLayers();
  // set the project projection
  this._projection = Projections.get(this.state.crs, this.state.proj4);
  // build a layerstore of the project
  this._layersStore = this._buildLayersStore();

  this.setters = {
    setBaseLayer: function(id) {
      this.state.baselayers.forEach((baseLayer) => {
        this._layersStore.getLayerById(baseLayer.id).setVisible(baseLayer.id == id);
      })
    }
  };

  base(this);
}

inherit(Project, G3WObject);

const proto = Project.prototype;

proto.getRelations = function() {
  return this.state.relations;
};

// process layers of the project
proto._processLayers = function() {
  //info useful for catalog
  let traverse = (obj) => {
    Object.entries(obj).forEach(([key, layer]) => {
      let layer_name_originale;
      let fulllayer;
      //check if layer (node) of folder
      if (!_.isNil(layer.id)) {
        let layers = this.state.layers;
        layers.forEach((lyr) => {
          layer_name_originale = lyr.name;
          if (layer.id == lyr.id) {
            lyr.wmsUrl = this.getWmsUrl();
            lyr.project = this;
            fulllayer = _.merge(lyr, layer);
            fulllayer.name = layer_name_originale;
            return false
          }
        });
        obj[parseInt(key)] = fulllayer;
      }
      if (!_.isNil(layer.nodes)) {
        //add title to tree
        layer.title = layer.name;
        traverse(layer.nodes);
      }
    });
  };

  // call trasverse function to
  traverse(this.state.layerstree);

  const baseLayers = this.state.baselayers;
  baseLayers.forEach((layerConfig) => {
    let visible = false;
    if (this.state.initbaselayer) {
      visible = (layerConfig.id == (this.state.initbaselayer));
    }
    if (layerConfig.fixed) {
      visible = layerConfig.fixed;
    }
    layerConfig.visible = visible;
    layerConfig.baselayer = true;
  });
};

// build layersstore and create layersstree
proto._buildLayersStore = function() {
  // create a layersStore object
  const layersStore = new LayersStore();
  const overviewprojectgid = this.state.overviewprojectgid ? this.state.overviewprojectgid.gid : null;
  layersStore.setOptions({
    id: this.state.gid,
    projection: this._projection,
    extent: this.state.extent,
    initextent: this.state.initextent,
    wmsUrl: this.state.WMSUrl,
    catalog: this.state.gid != overviewprojectgid
  });

  // instance each layer ad area added to layersstore
  const layers = this.getLayers();
  layers.forEach((layerConfig) => {
    // add projection
    layerConfig.projection = layerConfig.crs ? Projections.get(layerConfig.crs) : this._projection;
    const layer = LayerFactory.build(layerConfig, {
      project: this
    });
    layersStore.addLayer(layer);
  });
  // create layerstree from layerstore
  layersStore.createLayersTree(this.state.name, {
    layerstree: this.state.layerstree
  });
  return layersStore;
};

proto.getLayers = function() {
  return _.concat(this.state.layers,this.state.baselayers);
};

proto.getThumbnail = function() {
  return this.state.thumbnail;
};

proto.getState = function() {
  return this.state;
};

proto.getId = function() {
  return this.state.id;
};

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

proto.getLayersStore = function() {
  return this._layersStore;
};

module.exports = Project;
