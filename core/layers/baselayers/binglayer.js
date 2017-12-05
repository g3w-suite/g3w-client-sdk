var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var BaseLayer = require('core/layers/baselayers/baselayer');
var BasesLayers = require('g3w-ol3/src/layers/bases');

function BingLayer(options){
  base(this,options);
}

inherit(BingLayer, BaseLayer);

var proto = BingLayer.prototype;

proto._makeOlLayer = function(){
  var self = this;
  var olLayer;
  var subtype = this.config.source ? this.config.source.subtype : null;
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


module.exports = BingLayer;
