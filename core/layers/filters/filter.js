var Expression = require('./expression');

// classe Filtro per poter creare filtri
// chiesti principalmente dai providers per poter
// effettuare richieste di dati
function Filter() {
}

var proto = Filter.prototype;

// server per creare un filtro complesso
proto.setExpression = function(expression) {

};

proto.setGeometry = function(geometry) {
  this.geometry = geometry;
  return this;
};

proto.setBBOX = function(bbox) {

  this.bbox = [bbox];
  return this;

};

proto.setFids = function(ids) {
  this.id = ids;
  return this;
};

proto.serialize = function() {
  return JSON.stringify(this);
};




module.exports = Filter;
