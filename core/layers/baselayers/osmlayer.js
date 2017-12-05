var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var BaseLayer = require('core/layers/baselayers/baselayer');
var BasesLayers = require('g3w-ol3/src/layers/bases');

function OSMLayer(options){
  base(this,options);
  this.layer = null;
}

inherit(OSMLayer, BaseLayer);

var proto = OSMLayer.prototype;

proto._makeOlLayer = function() {
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


module.exports = OSMLayer;
