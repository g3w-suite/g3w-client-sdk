var MeasureInteraction = require('./measureinteraction');

// LenghtInteracion
var LenghtIteraction = function() {
  var options = {};
  options.geometryType = "LineString";
  MeasureInteraction.call(this, options)
};

ol.inherits(LenghtIteraction, MeasureInteraction);


module.exports = LenghtIteraction;