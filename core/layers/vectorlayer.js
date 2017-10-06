var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var Layer = require('./layer');
var TableLayer = require('./tablelayer');
var GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  base(this, config);
  this.type = Layer.LayerTypes.VECTOR;
  // mi server un layer ol per la visualizzazionei
  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  this.setup(config);
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

var proto = VectorLayer.prototype;

proto._setOtherConfigParameters = function(config) {
  this.config.editing.geometrytype = config.vector.geometrytype;
};

proto.getEditingGeometryType = function() {
  return this.config.editing.geometrytype;
};


module.exports = VectorLayer;