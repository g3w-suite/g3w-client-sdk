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
    //DA CAMBIARE
    var id = feature.get('gid');
    this.setId(id);
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
  this.state = {
    state: null /*stato dela feature
                     originale : null
                     nuovo: 0
                     aggiornato: 1,
                     cancellato: 2
                */
  };
};

ol.inherits(Feature, ol.Feature);

proto = Feature.prototype;

// setta la feature a state 2 delete
proto.delete = function() {
  this.state = 2;
};

//setta lo stato a feature aggiornata
proto.update = function() {
  this.state = 1;
};

// setta lo stato a nuovo 0
proto.add = function() {
  this.state = 0;
};

proto.isNew = function() {
  return this.state.state == 0;
};

proto.isUpdated = function() {
  return this.state.state == 1;
};

proto.isDeleted = function() {
  return this.state.state == 2;
};


module.exports = Feature;