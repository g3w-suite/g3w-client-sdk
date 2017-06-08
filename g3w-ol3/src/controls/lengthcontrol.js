var utils = require('../utils');
var LenghtIteraction = require('../interactions/lengthinteraction');
var MeasureControl = require('./measurecontrol');

var LenghtControl = function(options) {
  var _options = {
    name: "Lunghezza",
    label: "\ue908",
    interactionClass: LenghtIteraction
  };

  options = utils.merge(options,_options);
  MeasureControl.call(this, options);
};

ol.inherits(LenghtControl, MeasureControl);


module.exports = LenghtControl;
