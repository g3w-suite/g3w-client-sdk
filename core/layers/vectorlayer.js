var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var Layer = require('./layer');
var TableLayer = require('./tablelayer');
var GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  base(this, config);

  this.type = Layer.LayerTypes.VECTOR;
  // mi server un layer ol per la visualizzazione
  // le meodifiche verranno fatte sul featuresstore del layer
  this._olLayer = new ol.layer.Vector({
    name: this.name,
    source: new ol.source.Vector({
      features: new ol.Collection()
    })
  });
}

inherit(VectorLayer, TableLayer);

mixin(VectorLayer, GeoLayerMixin);

var proto = VectorLayer.prototype;

proto.getLayerForEditing = function() {
  // nel caso fosse già un vector layer ritorna se stesso
  return this;
};

// funzione che permette la visualizzazione del layer sulla mappa
proto.show = function(map) {
  map.addLayer(this._olLayer);
};


module.exports = VectorLayer;