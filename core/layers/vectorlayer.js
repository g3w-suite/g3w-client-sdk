var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var Layer = require('./layer');
var TableLayer = require('./tablelayer');
var GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  base(this, config);

  this.type = Layer.LayerTypes.VECTOR;
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

var proto = VectorLayer.prototype;

proto.getLayerForEditing = function() {
  // nel caso fosse già un vector layer ritorna se stesso
  return this;
};

module.exports = VectorLayer;