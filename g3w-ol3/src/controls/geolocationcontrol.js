var Control = require('./control');
function GeolocationControl() {
  var options = {
    name: "geolocation",
    tipLabel: "Geolocation",
    label: "\ue904"
  };
  Control.call(this, options);
}

ol.inherits(GeolocationControl, Control);

var proto = GeolocationControl.prototype;

proto.setMap = function(map) {
  var self = this;
  Control.prototype.setMap.call(this,map);
  // faccio la gestione tutta interna alla rimozione del controllo
  var geolocation = new ol.Geolocation({
    projection: map.getView().getProjection(),
    tracking: true
  });
  //mi metto in ascolto del proprety change in particolare quando viene settato allow o block
  geolocation.once('change:position', function(e) {
    if (this.getPosition()) {
      $(self.element).removeClass('g3w-ol-disabled');
      $(self.element).on('click', function() {
        var map = self.getMap();
        var view = map.getView();
        coordinates = geolocation.getPosition();
        view.setCenter(coordinates);
        self.dispatchEvent({
          type: 'click',
          coordinates: coordinates
        })
      });
    } else {
      self.hideControl();
    }
  });
  geolocation.once('error', function(e) {
    self.hideControl();
  });
};

proto.layout = function(map) {
  Control.prototype.layout.call(this, map);
  $(this.element).addClass('g3w-ol-disabled');
};


module.exports = GeolocationControl;