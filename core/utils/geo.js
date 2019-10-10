const Geometry = require('core/geometry/geometry');
const Filter = require('core/layers/filter/filter');
const MapLayersStoreRegistry = require('core/map/maplayersstoresregistry');

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
  },

  createSelectedStyle({geometryType}) {
    let style = null;
    if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
      style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(255,255,0)',
          width: 4
        })
      });
    }
    else if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 6,
          fill: new ol.style.Fill({
            color: 'rgb(255,255,0)'
          })
        }),
        zIndex: Infinity
      });

    } else if (geometryType === 'MultiPolygon' || geometryType === 'Polygon') {
      style = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgb(255,255,0)',
          width: 4
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 0, 0.5)'
        })
      });
    }
    return style;
  },

  getAlphanumericPropertiesFromFeature(properties=[]) {
    properties = Array.isArray(properties) ? properties : Object.keys(properties);
    return properties.filter((property) => {
      return ['boundedBy', 'geom', 'the_geom', 'geometry', 'bbox', 'GEOMETRY'].indexOf(property) === -1;
    });
  },

  getQueryLayersPromisesByCoordinates(layers, {coordinates, map, feature_count=10, querymultilayers=false}={}) {
    const d = $.Deferred();
    const size = map.getSize();
    if (!layers.length)
      return d.resolve(layers);
    const queryResponses = [];
    const mapProjection = map.getView().getProjection();
    const resolution = map.getView().getResolution();
    if (querymultilayers) {
      const multiLayers = _.groupBy(layers, function(layer) {
        return layer.getMultiLayerId();
      });
      let layersLenght = Object.keys(multiLayers).length;
      for (let key in multiLayers) {
        const _multilayer = multiLayers[key];
        const layers = _multilayer;
        const multilayer = multiLayers[key][0];
        const provider = multilayer.getProvider('query');
        provider.query({
          feature_count,
          coordinates,
          mapProjection,
          resolution,
          size,
          layers
        }).then((response)=> {
          queryResponses.push(response);
        }).always(() => {
          layersLenght -= 1;
          if (layersLenght === 0)
            d.resolve(queryResponses)
        })
      }
    } else {
      let layersLenght = layers.length;
      layers.forEach((layer) => {
        layer.query({
          feature_count,
          coordinates,
          mapProjection,
          size,
          resolution,
        }).then((response) => {
          queryResponses.push(response)
        }).always(() => {
          layersLenght -= 1;
          if (layersLenght === 0)
            d.resolve(queryResponses)
        })
      });
    }
    return d.promise();
  },

  getQueryLayersPromisesByGeometry(layers, options={}) {
    const d = $.Deferred();
    let filterGeometry = options.geometry;
    const bbox = options.bbox;
    const projection = options.projection;
    const queryResponses = [];
    const feature_count = options.feature_count || 10;
    if (!layers.length)
      d.resolve([]);
    const mapCrs = projection.getCode();
    const multiLayers = _.groupBy(layers, function(layer) {
      return `${layer.getMultiLayerId()}_${layer.getProjection().getCode()}`;
    });
    let layersLenght = Object.keys(multiLayers).length;
    for (let key in multiLayers) {
      const filter = new Filter();
      const _multilayer = multiLayers[key];
      const layers = _multilayer;
      const multilayer = multiLayers[key][0];
      const provider = multilayer.getProvider('filter');
      const layerCrs = multilayer.getProjection().getCode();
      if (mapCrs !== layerCrs) {
        if (bbox) {
          const geometry = ol.geom.Polygon.fromExtent(filterGeometry);
          filterGeometry = geometry.transform(mapCrs, layerCrs).getExtent();
        } else {
          filterGeometry = filterGeometry.clone().transform(mapCrs, layerCrs);
        }
      }
      bbox && filter.setBBOX(filterGeometry) ||  filter.setGeometry(filterGeometry);
      provider.query({
        filter,
        layers,
        feature_count
      }).then((response)=> {
        queryResponses.push(response);
      }).always(() => {
        layersLenght -= 1;
        if (layersLenght === 0)
          d.resolve(queryResponses)
      })
    }
    return d.promise();
  },

  parseQueryLayersPromiseResponses(responses) {
    const results = {
      query: responses[0] ? responses[0].query: null,
      data: []
    };
    responses.forEach((result) => {
      if (result.data)
        result.data.forEach(data => {results.data.push(data)});
    });
    return results;
  },

  getMapLayersByFilter(filter) {
    filter = filter || {};
    const mapFilter = {
      GEOLAYER: true
    };
    Object.assign(filter, mapFilter);
    let layers = [];
    MapLayersStoreRegistry.getQuerableLayersStores().forEach((layerStore) => {
      layers = layerStore.getLayers(filter);
    });
    return layers || [];
  },
  
  dissolve({features=[], index=0, clone=false}={}) {
    const parser = new jsts.io.OL3Parser();
    const featuresLength = features.length;
    let dissolvedFeature;
    switch (featuresLength) {
      case 0:
        dissolvedFeature = null;
        break;
      case 1:
        dissolvedFeature = features[0];
        break;
      default:
        const baseFeature = dissolvedFeature = clone ? features[index].clone() : features[index];
        const baseFeatureGeometry = baseFeature.getGeometry();
        const baseFeatureGeometryType = baseFeatureGeometry.getType();
        let jstsdissolvedFeatureGeometry = parser.read(baseFeatureGeometry);
        for (let i=0; i < featuresLength ; i++) {
          if (index !== i) {
            const feature = features[i];
            jstsdissolvedFeatureGeometry = jstsdissolvedFeatureGeometry.union(parser.read(feature.getGeometry()))
          }
        }
        const dissolvedFeatureGeometry = parser.write(jstsdissolvedFeatureGeometry);
        const dissolvedFeatureGeometryType = dissolvedFeatureGeometry.getType();
        const dissolvedFeatuteGeometryCoordinates = dissolvedFeatureGeometryType === baseFeatureGeometryType ?
          dissolvedFeatureGeometry.getCoordinates() :
          baseFeatureGeometryType.indexOf('Multi') !== -1 && dissolvedFeatureGeometryType === baseFeatureGeometryType.replace('Multi', '') ? [dissolvedFeatureGeometry.getCoordinates()] : null;
        if (dissolvedFeatuteGeometryCoordinates)
          baseFeature.getGeometry().setCoordinates(dissolvedFeatuteGeometryCoordinates);
        else
          dissolvedFeature = null;
    }
    return dissolvedFeature;
  }
};
