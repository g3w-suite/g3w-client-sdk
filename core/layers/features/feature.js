// Classe Feature che eridita da ol.Feature sfruttando tutti i metodi
// necessari anche alla costruzione di un layer vettoriale
// Allo stesso modo può essere un oggetto non vettoriale non settando la geometria
// ma solo le proprièta
var Feature = function(options) {

  ol.Feature.call(this);
  options = options || {};
  var feature = options.feature;
  //verificare come utilizzare clone
  if (feature) {
    this.setId(feature.getId());
    this.setProperties(feature.getProperties());
    this.setGeometryName(feature.getGeometryName());
    var geometry = feature.getGeometry();
    if (geometry) {
      this.setGeometry(geometry);
    }
    var style = this.getStyle();
    if (style) {
      this.setStyle(style);
    }
  }
  // necessario per poter interagire reattivamente con l'esterno
  this.state = {};
};

ol.inherits(Feature, ol.Feature);

proto = Feature.prototype;

proto.setState = function(state) {
  this.state = state;
};

proto.getState = function() {
  return this.state;
};


module.exports = Feature;