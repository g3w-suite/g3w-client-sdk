var Expression = require('./expression');

// classe Filtro per poter creare filtri
// chiesti principalmente dai providers per poter
// effettuare richieste di dati
function Filter() {
  this._filter = null;
  this._type = null;
}

var proto = Filter.prototype;

// server per creare un filtro complesso
proto.setExpression = function(expression) {
  this._type = Filter.TYPES.expression;
  this._filter = expression;
};

proto.setGeometry = function(geometry) {
  this._type = Filter.TYPES.geometry;
  this._filter = geometry;
  return this;
};

proto.setBBOX = function(bbox) {
  this._type = Filter.TYPES.bbox;
  this._filter = bbox;
  return this;
};

proto.setFids = function(ids) {
  this._type = Filter.TYPES.fids;
  this._filter = ids;
  return this;
};

proto.serialize = function() {
  return JSON.stringify(this);
};

// funzione che server per recuperare il valore del filtro
proto.get = function() {
  return this._filter;
};

proto.getType = function() {
  return this._type;
};

proto.clear = function() {
  this._filter = null;
};


Filter.TYPES = {
  bbox: 'bbox',
  geometry: 'geometry',
  expression: 'expression',
  fids: 'fids'
};

module.exports = Filter;
