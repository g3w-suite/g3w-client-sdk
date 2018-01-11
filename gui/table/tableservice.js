const GUI = require('gui/gui');
const coordinatesToGeometry =  require('core/utils/geo').coordinatesToGeometry;

const TableService = function(options) {
  options = options || {};
  const features = options.features || [];
  const headers = options.headers || [];
  const hasGeometry = this.hasGeometry(features);
  this.state = {
    features: features,
    title: options.title,
    headers: headers,
    geometry: hasGeometry
  };
  if (hasGeometry)
    this._addPkProperties(features);
};

const proto = TableService.prototype;

proto._setLayout = function() {
  //TODO
};

proto._returnGeometry = function(feature) {
  let geometry;
  if (feature.attributes) {
    geometry = feature.geometry;
  } else {
    geometry = coordinatesToGeometry(feature.geometry.type, feature.geometry.coordinates)
  }
  return geometry;
};

proto.hasGeometry = function(features) {
  if (features.length) {
    return !!features[0].geometry
  }
  return false
};

proto._addPkProperties = function(features) {
  features.forEach((feature) => {
    if (!feature.attributes)
      feature.properties[this.state.headers[0].name] = feature.id;
  })
};

proto.zoomAndHighLightSelectedFeature = function(feature, zoom=true) {
  const mapService = GUI.getComponent('map').getService();
  const geometry = this._returnGeometry(feature);
  mapService.highlightGeometry(geometry , {
    zoom: zoom
  });
};


module.exports = TableService;
