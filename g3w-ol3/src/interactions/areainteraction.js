const MeasureInteraction = require('./measureinteraction');

// Area

const AreaIteraction = function() {
  const options = {};
  options.geometryType = "Polygon";
  MeasureInteraction.call(this, options);
};

ol.inherits(AreaIteraction, MeasureInteraction);

module.exports = AreaIteraction;
