var Expression = require('./expression');

// classe Filtro per poter creare filtri
// chiesti principalmente dai providers per poter
// effettuare richieste di dati
function Filter() {
}

var proto = Filter.prototype;

// server per creare un filtro complesso
proto.setExpressionFilter = function(expression) {


};

proto.setGeometryFilter = function(geometry) {
  this.geometry = geometry;
  return this;
};

proto.setBBOXFilter = function(bbox) {

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
