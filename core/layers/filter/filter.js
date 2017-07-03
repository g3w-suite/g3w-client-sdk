var Expression = require('./expression');

// classe Filtro per poter creare filtri
// chiesti principalmente dai providers per poter
// effettuare richieste di dati
function Filter() {
  this._bbox = null;
  this._geometry = null;
  this._fids = null;
  this._expression = null;
}

var proto = Filter.prototype;

// server per creare un filtro complesso
proto.setExpression = function(expression) {
  this._expression = expression;
};

proto.getExpression = function() {
  return this._expression;
};

proto.setGeometry = function(geometry) {
  this._geometry = geometry;
  return this;
};

proto.getGeometry = function() {
  return this._geometry;
};

proto.setBBOX = function(bbox) {
  this._bbox = [bbox];
  return this;
};

proto.getBBOX = function() {
  return this._bbox;
};

proto.setFids = function(ids) {
  this._fids = ids;
  return this;
};

proto.getFids = function() {
  return this._fids;
};

proto.serialize = function() {
  return JSON.stringify(this);
};




module.exports = Filter;
