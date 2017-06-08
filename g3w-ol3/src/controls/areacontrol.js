var utils = require('../utils');
var AreaIteraction = require('../interactions/areainteraction');
var MeasureControl = require('./measurecontrol');

var AreaControl = function(options) {
  var _options = {
    name: "Area",
    label: "\ue909",
    interactionClass: AreaIteraction
  };
  options = utils.merge(options,_options);
  MeasureControl.call(this, options);
};

ol.inherits(AreaControl, MeasureControl);


module.exports = AreaControl;
