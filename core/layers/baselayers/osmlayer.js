var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var ImageLayer = require('core/layers/imagelayer');
var BasesLayers = require('g3w-ol3/src/layers/bases');

function OSMLayer(options){
  base(this,options);
  this.layer = null;
}

inherit(OSMLayer, ImageLayer);

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

proto.getLayerConfigs = function() {
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

proto._updateLayer = function(mapState, extraParams) {
  this._olLayer.setVisible(this.layer.isVisible());
};

module.exports = OSMLayer;
