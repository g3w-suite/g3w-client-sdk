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
    //DA CAMBIARE HARDCODED
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
                     add: 0
                     update: 1,
                     delete: 2
                */
  };
};

ol.inherits(Feature, ol.Feature);

proto = Feature.prototype;

proto.clone = function() {
  var feature = ol.Feature.prototype.clone.call(this);
  var clone =  new Feature({
    feature: feature
  });
  clone.setId(this.getId());
  clone.setState(this.getState());
  return clone;
};

proto.constructor = 'Feature';

// setta la feature a state 2 delete
proto.delete = function() {
  this.state.state = 'delete';
};

//setta lo stato a feature aggiornata
proto.update = function() {
  this.state.state = 'update';
};

// setta lo stato a nuovo 0
proto.add = function() { 
  this.state.state = 'add';
};

proto.isNew = function() {
  return !_.isNumber(this.getId()) && this.getId().indexOf('__new__') != -1;
};

proto.isAdded = function() {
  return this.state.state == 'add';
};

proto.isUpdated = function() {
  return this.state.state == 'update';
};

proto.isDeleted = function() {
  return this.state.state == 'delete';
};

proto.getState = function() {
  return this.state.state;
};

proto.setState = function(state) {
  this.state.state = state;
};



module.exports = Feature;