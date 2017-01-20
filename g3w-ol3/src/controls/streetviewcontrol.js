var utils = require('../utils');
var InteractionControl = require('./interactioncontrol');
var PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

var StreetViewControl = function(options) {
  var _options = {
    name: "streetview",
    tipLabel: "StreetView",
    label: "\ue905",
    interactionClass: PickCoordinatesInteraction
  };
  this._sv = null;
  this._panorama = null;
  this._map = null;
  this._projection = null;
  this._streetViewFeature = new ol.Feature();
  this._streetViewFeature.setStyle(style = new ol.style.Style({
    text: new ol.style.Text({
      text: '\ue905',
      font: 'bold 30px icomoon',
      textBaseline: 'Bottom',
      fill: new ol.style.Fill({
        color: '#3c8dbc'
      })
    })
  }));
  var streetVectorSource = new ol.source.Vector({
    features: []
  });

  this._layer = new ol.layer.Vector({
    source: streetVectorSource
  });
  options = utils.merge(options,_options);
  InteractionControl.call(this,options);
};

ol.inherits(StreetViewControl, InteractionControl);

var proto = StreetViewControl.prototype;


proto.getLayer = function() {
  return this._layer;
};

proto.setProjection = function(projection) {
  this._projection = projection;
};

proto.setPosition = function(position) {
  var self = this;
  var lnglat;
  if (!this._sv) {
    this._sv = new google.maps.StreetViewService();
  }
  this._sv.getPanorama({location: position}, function (data) {
    self._panorama = new google.maps.StreetViewPanorama(
      document.getElementById('streetview')
    );
    self._panorama.addListener('position_changed', function() {
      if (self.isToggled()) {
        lnglat = ol.proj.transform([this.getPosition().lng(), this.getPosition().lat()], 'EPSG:4326', self._projection.getCode());
        self._layer.getSource().getFeatures()[0].setGeometry(
          new ol.geom.Point(lnglat)
        );
        self._map.getView().setCenter(lnglat);
      }
    });
    if (data && data.location) {
      self._panorama.setPov({
        pitch: 0,
        heading: 0
      });
      self._panorama.setPosition(data.location.latLng);
    }
  })
};

proto.setMap = function(map) {
  var self = this;
  this._map = map;
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

proto.clear = function() {
  this._layer.getSource().clear();
  this._streetViewFeature.setGeometry(null);
};

proto.toggle = function(toggle) {
  InteractionControl.prototype.toggle.call(this, toggle);
  if (!this.isToggled()) {
    this.clear()
  } else {
    this._layer.getSource().addFeatures([this._streetViewFeature]);
  }
};

module.exports = StreetViewControl;
