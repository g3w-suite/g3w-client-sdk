var utils = require('../utils');
var InteractionControl = require('./interactioncontrol');
var PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

var StreetViewControl = function(options){
  var _options = {
    name: "streetview",
    tipLabel: "StreetView",
    label: "\ue905",
    interactionClass: PickCoordinatesInteraction
  };
  options = utils.merge(options,_options);
  InteractionControl.call(this,options);
};

ol.inherits(StreetViewControl, InteractionControl);

var proto = StreetViewControl.prototype;

proto.setMap = function(map) {
  var self = this;
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('picked',function(e){
    self.dispatchEvent({
      type: 'picked',
      coordinates: e.coordinate
    });
    if (self._autountoggle) {
      self.toggle();
    }
  });
};

module.exports = StreetViewControl;
