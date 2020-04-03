const Control = require('./control');
function GeolocationControl() {
  const options = {
    name: "geolocation",
    tipLabel: "Geolocation",
    label: "\ue904"
  };
  Control.call(this, options);
}

ol.inherits(GeolocationControl, Control);

const proto = GeolocationControl.prototype;

proto.setMap = function(map) {
  const self = this;
  Control.prototype.setMap.call(this,map);
  const geolocation = new ol.Geolocation({
    projection: map.getView().getProjection(),
    tracking: true
  });
  geolocation.once('change:position', function(e) {
    if (this.getPosition()) {
      $(self.element).removeClass('g3w-ol-disabled');
      $(self.element).on('click', function() {
        const map = self.getMap();
        const view = map.getView();
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
    if (e.code != 1) {
      self.dispatchEvent('error');
    }
  });
};

proto.layout = function(map) {
  Control.prototype.layout.call(this, map);
  $(this.element).addClass('g3w-ol-disabled');
};


module.exports = GeolocationControl;
