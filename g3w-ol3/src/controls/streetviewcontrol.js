var utils = require('../utils');
var QueryControl = require('./querycontrol');

var PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

var StreetViewControl = function(options){
  var self = this;
  var _options = {
    name: "streetview",
    tipLabel: "StreetView",
    label: "\uea0f",
    interactionClass: PickCoordinatesInteraction
  };
  options = utils.merge(options,_options);
  QueryControl.call(this,options);
};

ol.inherits(StreetViewControl, QueryControl);


module.exports = QueryControl;
