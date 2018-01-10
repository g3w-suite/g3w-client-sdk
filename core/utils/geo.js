const Geometry = require('core/geometry/geometry');

const OGC_PIXEL_WIDTH = 0.28;
const OGC_DPI = 25.4/OGC_PIXEL_WIDTH;

module.exports = {
  resToScale: function(res, unit) {
    unit = unit || 'm';
    let scale;
    switch (unit) {
      case 'm':
        scale = (res*1000) / OGC_PIXEL_WIDTH;
        break;
    }
    return scale;
  },
  scaleToRes: function(scale, unit) {
    unit = unit || 'm';
    let resolution;
    switch (unit) {
      case 'm':
        resolution = (scale * OGC_PIXEL_WIDTH) / 1000;
        break
    }
    return resolution;
  },
  coordinatesToGeometry: function(geometryType, coordinates) {
    let geometryClass;
    switch (geometryType) {
      case Geometry.GeometryTypes.POLYGON:
        geometryClass = ol.geom.Polygon;
        break;
      case Geometry.GeometryTypes.MULTIPOLYGON:
        geometryClass = ol.geom.MultiPolygon;
        break;
      case Geometry.GeometryTypes.LINESTRING:
      case Geometry.GeometryTypes.LINE:
        geometryClass = ol.geom.LineString;
        break;
      case Geometry.GeometryTypes.MULTILINE:
      case Geometry.GeometryTypes.MULTILINESTRING:
        geometryClass = ol.geom.MultiLineString;
        break;
      case Geometry.GeometryTypes.POINT:
        geometryClass = ol.geom.Point;
        break;
      case (Geometry.GeometryTypes.MULTIPOINT):
        geometryClass = ol.geom.MultiPoint;
        break;
      default:
        geometryClass = ol.geom.Point;
    }
    return new geometryClass(coordinates);
  }
};
