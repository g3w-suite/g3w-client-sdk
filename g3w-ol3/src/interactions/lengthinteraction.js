var MeasureInteraction = require('./measureinteraction');

// LenghtInteracion
var LengthIteraction = function() {
  var options = {};
  options.geometryType = "LineString";
  MeasureInteraction.call(this, options)
};

ol.inherits(LengthIteraction, MeasureInteraction);


module.exports = LengthIteraction;