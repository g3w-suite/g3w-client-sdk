var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var geo = require('core/utils/geo');
var MapLayer = require('core/map/layer/maplayer');
var RasterLayers = require('g3w-ol3/src/layers/rasters');

var GENERCI_GRID_EXTENT = [0,0,8388608,8388608];
var STANDARD_PROJECTIONS = [3857,900913,4326];

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
  var crs = this.layer.getCrs();

  var layerOptions = {
    url: this.layer.getCacheUrl()+"/{z}/{x}/{y}.png",
    maxZoom: 20
  };

  if (STANDARD_PROJECTIONS.indexOf(crs) < 0) {
    layerOptions.projection = new ol.proj.Projection({
      code: "EPSG:"+crs,
      extent: GENERCI_GRID_EXTENT
    })
  }

  var olLayer = RasterLayers.XYZLayer(layerOptions);

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
