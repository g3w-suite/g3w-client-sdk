var utils = require('../utils');
var InteractionControl = require('./interactioncontrol');
var LenghtIteraction = require('../interactions/lenghtiteraction');

var LenghtControl = function(options) {
  var _options = {
    name: "Lunghezza",
    label: "\ue908",
    interactionClass: LenghtIteraction
  };

  this._map = null;
  this._projection = null;
  options = utils.merge(options,_options);
  InteractionControl.call(this, options);
};

ol.inherits(LenghtControl, InteractionControl);

var proto = LenghtControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this, map);
};

proto.toggle = function(toggle) {
  InteractionControl.prototype.toggle.call(this, toggle);
  if (!this.isToggled()) {
    this.getIteraction().clear();
  }
};
module.exports = LenghtControl;
