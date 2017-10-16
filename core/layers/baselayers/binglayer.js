var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var ImageLayer = require('core/layers/imagelayer');
var BasesLayers = require('g3w-ol3/src/layers/bases');

function BingLayer(options,extraParams){
  var self = this;
  base(this,options);
  this.layer = null;
}

inherit(BingLayer, ImageLayer);

var proto = BingLayer.prototype;

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

proto._makeOlLayer = function(){
  var self = this;

  var olLayer;
  var subtype = this.layer.state.source ? this.layer.state.source.subtype : null;
  switch(subtype) {
    case 'streets':
      olLayer = BasesLayers.BING.Road;
      break;
    case 'aerial':
      olLayer = BasesLayers.BING.Aerial;
      break;
    case 'aerialwithlabels':
      olLayer = BasesLayers.BING.AerialWithLabels;
      break;
    default:
      olLayer = BasesLayers.BING.Aerial;
      break;
  }
  
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

module.exports = BingLayer;
