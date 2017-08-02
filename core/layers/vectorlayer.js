var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var Layer = require('./layer');
var TableLayer = require('./tablelayer');
var GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  base(this, config);
  var self = this;
  this.type = Layer.LayerTypes.VECTOR;
  this._color = VectorLayer.COLORS.splice(0,1).pop();
  // mi server un layer ol per la visualizzazionei
  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  this.setup(config);
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

var proto = VectorLayer.prototype;

// funzione che restituisce il layer per l'editing
proto.getLayerForEditing = function() {
  // nel caso fosse già un vector layer ritorna se stesso
  var editingLayer = _.cloneDeep(this);
  return this;
};

proto.getColor = function() {
  return this._color;
};

// qui ci sono i colori che possono essere usati dal layer
// ad esempio nella visualizzazione
VectorLayer.COLORS = [
  '#ff790d',
  '#62bdff',
  '#7aff54',
  '#00ffbf',
  '#00bfff',
  '#0040ff',
  '#8000ff',
  '#ff00ff',
  '#331909',
  '#234d20',
  '#7f3e16'
];

module.exports = VectorLayer;