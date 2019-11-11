const Geometry = require('core/geometry/geometry');
module.exports = {
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
    const geometry = new geometryClass(coordinates);
    return geometry
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
            const reprj = TransCoord(shpRecords[i].shape.content.x, shpRecords[i].shape.content.y);
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
  },

  createLayerStyle: function(styleObj) {
    let style;
    const styles = {};
    if (styleObj) {
      Object.entries(styleObj).forEach(([type, config]) => {
        switch (type) {
          case 'point':
            if (config.icon) {
              styles.image = new ol.style.Icon({
                src: config.icon.url,
                imageSize: config.icon.width
              })
            }
            break;
          case 'line':
            styles.stroke = new ol.style.Stroke({
              color: config.color,
              width: config.width
            });
            break;
          case 'polygon':
            styles.fill = new ol.style.Fill({
              color: config.color
            });
            break
        }
      });
      style = new ol.style.Style(styles);
    }
    return style
  },

  createOlLayer: function(options = {}) {
    const id = options.id;
    const geometryType = options.geometryType;
    const color = options.color;
    let style = options.style;
    // create ol layer to add to map
    const olSource = new ol.source.Vector({
      features: new ol.Collection()
    });
    const olLayer = new ol.layer.Vector({
      id: id,
      source: olSource
    });
    if (!style) {
      switch (geometryType) {
        case 'Point' || 'MultiPoint':
          style = new ol.style.Style({
            image: new ol.style.Circle({
              radius: 5,
              fill: new ol.style.Fill({
                color: color
              })
            })
          });
          break;
        case 'Line' || 'MultiLine':
          style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              width: 3,
              color: color
            })
          });
          break;
        case 'Polygon' || 'MultiPolygon':
          style =  new ol.style.Style({
            stroke: new ol.style.Stroke({
              color:  color,
              width: 3
            }),
            fill: new ol.style.Fill({
              color: color
            })
          });
          olLayer.setOpacity(0.6);
      }
    }
    olLayer.setStyle(style);
    return olLayer;
  }
};
