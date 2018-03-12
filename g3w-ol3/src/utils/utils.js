const utils = {
  getExtentForViewAndSize: function(center, resolution, rotation, size) {
    const dx = resolution * size[0] / 2;
    const dy = resolution * size[1] / 2;
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const xCos = dx * cosRotation;
    const xSin = dx * sinRotation;
    const yCos = dy * cosRotation;
    const ySin = dy * sinRotation;
    const x = center[0];
    const y = center[1];
    const x0 = x - xCos + ySin;
    const x1 = x - xCos - ySin;
    const x2 = x + xCos - ySin;
    const x3 = x + xCos + ySin;
    const y0 = y - xSin - yCos;
    const y1 = y - xSin + yCos;
    const y2 = y + xSin + yCos;
    const y3 = y + xSin - yCos;
    return [Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3), Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3)]
  },
  // function that create a polygon vector layer from bbox
  createPolygonLayerFromBBox: function(bbox) {
    const polygonFeature = new ol.Feature(new ol.geom.Polygon.fromExtent(bbox));
    const vectorSource = new ol.source.Vector({
      features: [polygonFeature]
    });
    const polygonLayer = new ol.layer.Vector({
      source: vectorSource
    });
    return polygonLayer;
  },
  reverseGeometry: function(geometry) {
    const reverseCoordinates = (coordinates) => {
      coordinates.find((coordinate) => {
        if (Array.isArray(coordinate)) {
          reverseCoordinates(coordinate)
        } else {
          const [y, x] = coordinates;
          coordinates[0] = x;
          coordinates[1] = y;
          return true
        }
      })
    };
    let coordinates = geometry.getCoordinates();
    reverseCoordinates(coordinates);
    geometry.setCoordinates(coordinates);
    return geometry
  }
};

module.exports = utils;
