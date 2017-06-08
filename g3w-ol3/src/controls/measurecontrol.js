var InteractionControl = require('./interactioncontrol');

var MeasureControl = function(options) {
  this._map = null;
  this._projection = null;
  InteractionControl.call(this, options);
};

ol.inherits(MeasureControl, InteractionControl);

var proto = MeasureControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this, map);
};

proto.toggle = function(toggle) {
  InteractionControl.prototype.toggle.call(this, toggle);
  if (!this.isToggled()) {
    //vado a fare il clen del measure control che erara stato eventualmente acceso
    // esempio area se attivo su lenght e viceversa
    this.getIteraction().clear();
  }
};

module.exports = MeasureControl;
