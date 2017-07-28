// Classe derivante dal ol.layer.Vector
// così posso customizzarla per i miei scopi come per undo redo
var olVectorLayer = function(options) {
  ol.layer.Vector.call(this, options);
};

ol.inherits(olVectorLayer, ol.layer.Vector);

var proto = olVectorLayer.prototype;

proto.addFeature = function(feature) {
  this.getSource().addFeature(feature);
};

proto.removeFeature = function(feature) {
  this.getSource().removeFeature(feature);
};

proto.updateFetaure = function(feature) {
  //da scrivere bene
  this.getSource();
};

module.exports = olVectorLayer;