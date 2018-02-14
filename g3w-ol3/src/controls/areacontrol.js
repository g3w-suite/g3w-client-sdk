const utils = require('../utils');
const AreaIteraction = require('../interactions/areainteraction');
const MeasureControl = require('./measurecontrol');

const AreaControl = function(options) {
  const _options = {
    name: "Area",
    label: "\ue909",
    interactionClass: AreaIteraction
  };
  options = utils.merge(options,_options);
  MeasureControl.call(this, options);
};

ol.inherits(AreaControl, MeasureControl);


module.exports = AreaControl;
