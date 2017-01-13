var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var geo = require('core/utils/geo');
var MapLayer = require('core/map/layer/maplayer');
var BasesLayers = require('g3w-ol3/src/layers/bases');

function OSMLayer(options,extraParams){
  var self = this;
  base(this,options);
  this.layer = null;
}

inherit(OSMLayer,MapLayer);

var proto = OSMLayer.prototype;

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

  
  var olLayer = BasesLayers.OSM;
  
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

module.exports = OSMLayer;
