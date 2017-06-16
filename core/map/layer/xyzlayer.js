var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var geo = require('core/utils/geo');
var MapLayer = require('core/map/layer/maplayer');
var RasterLayers = require('g3w-ol3/src/layers/rasters');

var CACHE_GRID_EXTENT = [0,0,8388608,8388608];

function XYZLayer(options,extraParams){
  var self = this;
  base(this,options);
  this.layer = null;
}

inherit(XYZLayer,MapLayer);

var proto = XYZLayer.prototype;

proto.getOLLayer = function(){
  var olLayer = this._olLayer;
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
  var self = this;

  var projection = new ol.proj.Projection({
    code: "EPSG:"+this.layer.getCrs(),
    extent: CACHE_GRID_EXTENT
  });

  var olLayer = RasterLayers.XYZLayer({
    url: this.layer.getCacheUrl()+"/{z}/{x}/{y}.png",
    projection: projection,
    maxZoom: 20
  });

  olLayer.getSource().on('imageloadstart', function() {
    self.emit("loadstart");
  });
  olLayer.getSource().on('imageloadend', function() {
    self.emit("loadend");
  });

  return olLayer
};

proto._updateLayer = function(mapState,extraParams){
  this._olLayer.setVisible(this.layer.isVisible());
};

module.exports = XYZLayer;
