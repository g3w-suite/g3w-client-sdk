const utils = require('../utils');
const LenghtIteraction = require('../interactions/lengthinteraction');
const MeasureControl = require('./measurecontrol');

const LengthControl = function(options) {
  const _options = {
    name: "Length",
    label: "\ue908",
    interactionClass: LenghtIteraction
  };

  options = utils.merge(options,_options);
  MeasureControl.call(this, options);
};

ol.inherits(LengthControl, MeasureControl);


module.exports = LengthControl;
