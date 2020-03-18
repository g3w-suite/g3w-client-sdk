const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const mixin = require('core/utils/utils').mixin;
const Layer = require('./layer');
const TableLayer = require('./tablelayer');
const GeoLayerMixin = require('./geolayermixin');
const VectoMapLayer = require('./map/vectorlayer');
const OLFeaturesStore = require('./features/olfeaturesstore');

function VectorLayer(config={}, options) {
  base(this, config, options);
  this.type = Layer.LayerTypes.VECTOR;
  this._mapLayer = null;
  this.setup(config, options);
  this.onafter('setColor', () => {})
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

const proto = VectorLayer.prototype;

proto.setFeaturesStore = function(featuresstore) {
  featuresstore = featuresstore || new OLFeaturesStore({
    provider: this.providers.data
  });
  this._featuresstore = featuresstore;
};

proto.getEditingLayer = function() {
  return this.getMapLayer().getOLLayer();
};

proto._setOtherConfigParameters = function(config) {
  this.config.editing.geometrytype = config.geometrytype;
};

proto.getEditingGeometryType = function() {
  return this.config.editing.geometrytype;
};

proto.getMapLayer = function() {
  if (this._mapLayer)
    return this._mapLayer;
  const id = this.getId();
  const geometryType =  this.getGeometryType();
  const color = this.getColor();
  const style = this.getStyle();
  const provider = this.getProvider('data');
  const featuresstore = this.getEditor() && this.getEditor().getSource();
  this._mapLayer = new VectoMapLayer({
    id,
    geometryType,
    color,
    style,
    provider,
    featuresstore
  });
  return this._mapLayer;
};


module.exports = VectorLayer;
