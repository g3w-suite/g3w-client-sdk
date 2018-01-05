const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const mixin = require('core/utils/utils').mixin;
const Layer = require('./layer');
const TableLayer = require('./tablelayer');
const GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  base(this, config);
  this.type = Layer.LayerTypes.VECTOR;
  // mi server un layer ol per la visualizzazionei
  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  this.setup(config);
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

const proto = VectorLayer.prototype;

proto._setOtherConfigParameters = function(config) {
  this.config.editing.geometrytype = config.vector.geometrytype;
};

proto.getEditingGeometryType = function() {
  return this.config.editing.geometrytype;
};


module.exports = VectorLayer;
