var MeasureInteraction = require('./measureinteraction');

// Area

var AreaIteraction = function() {
  var options = {};
  options.geometryType = "Polygon";
  MeasureInteraction.call(this, options);
};

ol.inherits(AreaIteraction, MeasureInteraction);

module.exports = AreaIteraction;