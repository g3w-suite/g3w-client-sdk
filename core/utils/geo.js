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
  },
  shpToGeojson: function(config, returnData) {
    const inputData = {};
    const EPSG4326 = "EPSG:4326";
    const EPSGUser = config.EPSG || EPSG4326;
    const  url = config.url;
    const encoding = typeof config.encoding != 'utf-8' ? config.encoding : 'utf-8';
    function TransCoord(x, y) {
      const p = ol.proj.transform([parseFloat(x), parseFloat(y)], EPSGUser, EPSG4326);
      return {x: p[0], y: p[1]};
    }

    function shpLoader(data, returnData) {
      inputData['shp'] = data;
      if(inputData['shp'] && inputData['dbf'])
        if(returnData) returnData(  toGeojson(inputData)  );
    }

    function dbfLoader(data, returnData) {
      inputData['dbf'] = data;
      if(inputData['shp'] && inputData['dbf'])
        if(returnData) returnData(  toGeojson(inputData)  );
    }

    function toGeojson(geojsonData) {
      let geojson = {},
        features = [],
        feature, geometry, points;

      const shpRecords = geojsonData.shp.records;
      const dbfRecords = geojsonData.dbf.records;

      geojson.type = "FeatureCollection";
      min = TransCoord(geojsonData.shp.minX, geojsonData.shp.minY);
      max = TransCoord(geojsonData.shp.maxX, geojsonData.shp.maxY);
      geojson.bbox = [
        min.x,
        min.y,
        max.x,
        max.y
      ];

      geojson.features = features;
      for (let i = 0; i < shpRecords.length; i++) {
        feature = {};
        feature.type = 'Feature';
        geometry = feature.geometry = {};
        properties = feature.properties = dbfRecords[i];

        // point : 1 , polyline : 3 , polygon : 5, multipoint : 8
        switch(shpRecords[i].shape.type) {
          case 1:
            geometry.type = "Point";
            var reprj = TransCoord(shpRecords[i].shape.content.x, shpRecords[i].shape.content.y);
            geometry.coordinates = [
              reprj.x, reprj.y
            ];
            break;
          case 3:
          case 8:
            geometry.type = (shpRecords[i].shape.type == 3 ? "LineString" : "MultiPoint");
            geometry.coordinates = [];
            for (let j = 0; j < shpRecords[i].shape.content.points.length; j+=2) {
              const reprj = TransCoord(shpRecords[i].shape.content.points[j], shpRecords[i].shape.content.points[j+1]);
              geometry.coordinates.push([reprj.x, reprj.y]);
            }
            break;
          case 5:
            geometry.type = "Polygon";
            geometry.coordinates = [];
            for (let pts = 0; pts < shpRecords[i].shape.content.parts.length; pts++) {
              let partsIndex = shpRecords[i].shape.content.parts[pts],
                part = [];
              for (let j = partsIndex*2; j < (shpRecords[i].shape.content.parts[pts+1]*2 || shpRecords[i].shape.content.points.length); j+=2) {
                const point = shpRecords[i].shape.content.points;
                const reprj = TransCoord(point[j], point[j+1]);
                part.push([reprj.x, reprj.y]);
              }
              geometry.coordinates.push(part);

            }
            break;
          default:
        }
        if("coordinates" in feature.geometry) features.push(feature);
      }
      return geojson;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      let URL = window.URL || window.webkitURL || window.mozURL || window.msURL,
        zip = new JSZip(e.target.result),
        shpString =  zip.file(/.shp$/i)[0].name,
        dbfString = zip.file(/.dbf$/i)[0].name;
      SHPParser.load(URL.createObjectURL(new Blob([zip.file(shpString).asArrayBuffer()])), shpLoader, returnData);
      DBFParser.load(URL.createObjectURL(new Blob([zip.file(dbfString).asArrayBuffer()])), encoding, dbfLoader, returnData);
    };
    reader.readAsArrayBuffer(url);
  }

};
