const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const geo = require('core/utils/geo');
const MapLayer = require('./maplayer');
const RasterLayers = require('g3w-ol3/src/layers/rasters');

const GENERCI_GRID_EXTENT = [0,0,8388608,8388608];
const STANDARD_PROJECTIONS = [3857,900913,4326];

function XYZLayer(options,extraParams){
  base(this,options);
  this.layer = null;
}

inherit(XYZLayer,MapLayer);

const proto = XYZLayer.prototype;

proto.getOLLayer = function(){
  let olLayer = this._olLayer;
  if (!olLayer){
    olLayer = this._olLayer = this._makeOlLayer();
  }
  return olLayer;
};

proto.getSource = function(){
  return this.getOLLayer().getSource();
};

proto.getLayerConfigs = function(){
  return this.layer;
};

proto.addLayer = function(layer){
  this.layer = layer;
};

proto.toggleLayer = function(layer){
  this._updateLayers();
};

proto.update = function(mapState, extraParams) {
  this._updateLayer(mapState, extraParams);
};

proto.isVisible = function(){
  return layer.state.visible;
};

proto._makeOlLayer = function(){
  const projection = this.projection ? this.projection : this.layer.getProjection();
  const layerOptions = {
    url: this.layer.getCacheUrl()+"/{z}/{x}/{y}.png",
    maxZoom: 20
  };

  /*if (STANDARD_PROJECTIONS.indexOf(crs) < 0) {
    layerOptions.projection = new ol.proj.Projection({
      code: "EPSG:"+crs,
      extent: GENERIC_GRID_EXTENT
    })
  }*/

  layerOptions.projection = projection;
  const olLayer = RasterLayers.XYZLayer(layerOptions);

  olLayer.getSource().on('imageloadstart', () => {
    this.emit("loadstart");
  });
  olLayer.getSource().on('imageloadend', () => {
    this.emit("loadend");
  });

  return olLayer
};

proto._updateLayer = function(mapState, extraParams) {
  this._olLayer.setVisible(this.layer.isVisible());
};

module.exports = XYZLayer;
