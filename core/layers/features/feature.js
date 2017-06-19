// Classe Feature che eridita da ol.Feature sfruttando tutti i metodi
// necessari anche alla costruzione di un layer vettoriale
// Allo stesso modo può essere un oggetto non vettoriale non settando la geometria
// ma solo le proprièta
var Feature = function(options) {
  ol.Feature.call(this, options);
  // necessario per poter interagire reattivamente con l'esterno
  this.state = {
    //attributi reattivi
  }
};

ol.inherits(Feature, ol.Feature);


module.exports = Feature;