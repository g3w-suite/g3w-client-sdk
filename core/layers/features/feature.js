// Classe Feature che eridita da ol.Feature sfruttando tutti i metodi
// necessari anche alla costruzione di un layer vettoriale
// Allo stesso modo può essere un oggetto non vettoriale non settando la geometria
// ma solo le proprièta
var Feature = function(options) {
  ol.Feature.call(this);
  options = options || {};
  this._newPrefix = '_new_';
  // mi serve per capire quale è la pk della feature
  this._pk = options.pk || "id";
  var feature = options.feature;
  //verificare come utilizzare clone
  if (feature) {
    this.setProperties(feature.getProperties());
    //vado a scrivere l'id univoco (corrispondente alla chiave primaria
    this.setId(feature.getId());
    // aggiungo il campo e il valore pk se non presente
    if (!_.isNull(this.get(this._pk)))
      this.set(this._pk, feature.getId());
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
    new: false
  };
};

ol.inherits(Feature, ol.Feature);

proto = Feature.prototype;

// vado a cambiare il costruttore
proto.constructor = 'Feature';

proto.clone = function() {
  // clono la feature
  var feature = ol.Feature.prototype.clone.call(this);
  feature.setId(this.getId());
  var clone =  new Feature({
    feature: feature,
    pk: this._pk
  });
  // aggiungo lo state
  clone.setState(this.getState());
  return clone;
};

proto.setNewPkValue = function() {
  var newValue = this._newPrefix + Date.now();
  this.set(this._pk, newValue);
  this.setId(this.getPk());
  // vado a settarla come id della feature
  this.setNew();
};

proto.setNew = function() {

  this.state.new = true;
};

proto.getPkFieldName = function() {
  return this._pk;
};

// funzione che restituisce il valore della primary key
proto.getPk = function() {
  return this.get(this._pk);
};

proto.setPk = function(value) {
  this.set(this._pk, value);
};

proto.unsetPk = function() {
  this.unset(this._pk);
};

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
  return this.state.new;
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