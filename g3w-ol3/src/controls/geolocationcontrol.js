var Control = require('./control');
function GeolocationControl() {
  var self = this;
  var options = {
    name: "geolocation",
    tipLabel: "Geolocation",
    label: "\ue904"
  };
  this._geolocation = null;
  this._map = null;
  this.init = function(map) {
    this._map = map;
    this._geolocation = new ol.Geolocation({
      projection: map.getView().getProjection(),
      tracking: true
    });
  };
  Control.call(this, options);
}

ol.inherits(GeolocationControl, Control);

var proto = GeolocationControl.prototype;

proto.setMap = function(map) {
  if (!this._map) {
    this.init(map);
  }
  Control.prototype.setMap.call(this,map);
};

proto.layout = function(map) {
  var self = this;
  $(this.element).on('click', function() {
    var map = self.getMap();
    var view = map.getView();
    coordinate = self._geolocation.getPosition();
    view.setCenter(coordinate);
    view.setZoom(6);
  });
  Control.prototype.layout.call(this,map);
};

proto.getGeolocation = function() {
  return this._geolocation;
};



module.exports = GeolocationControl;