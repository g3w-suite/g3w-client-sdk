const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const geoutils = require('g3w-ol3/src/utils/utils');
const G3WObject = require('core/g3wobject');

function Provider(options = {}) {
  this._isReady = false;
  this._name = 'provider';
  this._layer = options.layer;
  base(this);
}

inherit(Provider, G3WObject);

const proto = Provider.prototype;

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
};

proto.getFeatures = function() {
  console.log('da sovrascrivere')
};

proto.query = function(options) {
  console.log('metodo da sovrascrivere')
};

proto.setReady = function(bool) {
  this._isReady = bool;
};

proto.isReady = function() {
  return this._isReady;
};

proto.error = function() {
  //TODO
};

proto.isValid = function() {
  console.log('overwriteby single provider');
};

proto.getName = function() {
  return this._name;
};

// to extract gml from multiple (Tuscany region)
proto.extractGML = function (response) {
  if (response.substr(0,2) !== '--')
    return response;
  const gmlTag1 = new RegExp("<([^ ]*)FeatureCollection");
  const gmlTag2 = new RegExp("<([^ ]*)msGMLOutput");
  const boundary = '\r\n--';
  const parts = response.split(new RegExp(boundary));
  parts.forEach((part) => {
    isGmlPart = part.search(gmlTag1) > -1 ? true : part.search(gmlTag2) > -1 ? true : false;
    if (isGmlPart) {
      const gml = part.substr(part.indexOf("<?xml"));
      return gml;
    }
  });
};

proto.handleQueryResponseFromServerSingleLayer = function(layer, response, projections, wms=true) {
  let layerName = layer.getName();
  let layerFeatures;
  switch (layer.getInfoFormat()) {
    case 'json':
      parser = this._parseLayerGeoJSON;
      data = response.vector.data;
      const features = parser.call(this, data, ogcservice);
      layerFeatures = [{
        layer,
        features
      }];
      break;
    default:
      const x2js = new X2JS();
      if (!_.isString(response))
        response = new XMLSerializer().serializeToString(response);
      try {
        if (_.isString(response)) {
          // check if contain msGMLOutput
          if(!/msGMLOutput/.test(response)) {
            let fakeName;
            if (layer.isWmsUseLayerIds() && wms) {
              layerName = fakeName = layer.getId();
              jsonresponse = x2js.xml_str2json(response);
            } else {
              layerName = wms ? layerName.replace(/[/\s]/g, '') : layerName.replace(/[/\s]/g, '_');
              layerName = layerName.replace(/(\'+)/, '');
              layerName = layerName.replace(/(\)+)/, '');
              layerName = layerName.replace(/(\(+)/, '');
              let reg = new RegExp(`qgs:${layerName}\\b`, "g");
              fakeName = `g3wlayer${layerName}`;
              response = response.replace(reg, `qgs:${fakeName}`);
              //other layer evantually with name starting with numerber
              response = response.replace(/qgs:[0-9]+/g, 'qgs:otherLayer');
              jsonresponse = x2js.xml_str2json(response);
            }
            const FeatureCollection = jsonresponse.FeatureCollection;
            if(FeatureCollection && FeatureCollection.featureMember)
              FeatureCollection.featureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember.filter((feature) => {
                return feature[fakeName];
              }) : FeatureCollection.featureMember[fakeName] ? [FeatureCollection.featureMember] : [];
            else
              FeatureCollection.featureMember = [];
          } else
            jsonresponse = x2js.xml_str2json(response);
        }
      } catch (error) {
        return;
      }
      const rootNode = _.keys(jsonresponse)[0];
      switch (rootNode) {
        case 'FeatureCollection':
          layerFeatures = this._parseLayerFeatureCollection({
            jsonresponse,
            layer,
            projections
          });
          break;
        case "msGMLOutput":
          const layers = layer.getQueryLayerOrigName();
          parser = new ol.format.WMSGetFeatureInfo({
            layers
          });
          const features = parser.readFeatures(response);
          layerFeatures = [{
            layer,
            features
          }];
          break;
      }
  }
  return layerFeatures;
};

// Method to transform xml from server to present to queryreult component
proto.handleQueryResponseFromServer = function(response, projections, layers, wms=true) {
  layers = layers ? layers : [this._layer];
  const layer = layers[0];
  if (layer.getType() === "table" || !layer.isExternalWMS()) {
    response =  this._handleXMLStringResponseBeforeConvertToJSON({
      layers,
      response,
      wms
    });
    return this._getHandledResponsesFromResponse({
      response,
      layers,
      projections
      //id: false //used in case of layer id .. but for now is set to false in case of layerid starting with number
    });
  } else {
    //case of
    if ( /msGMLOutput/.test(response)) {
      return layers.map((layer) => {
        const layers = layer.getQueryLayerOrigName();
        const parser = new ol.format.WMSGetFeatureInfo({
          layers
        });
        const features = parser.readFeatures(response);
        return {
          layer,
          features
        }
      })
    } else {
      return layers.map((layer) => {
        return this._handleWMSMultilayers({
          layer,
          response,
          projections
        })
      })
    }
  }
};

proto._handleWMSMultilayers = function({layer, response, projections} = {}) {
  const x2js = new X2JS();
  const jsonresponse =  x2js.xml_str2json(response);
  // in case of parser return null
  if (!jsonresponse) return [{
    layer,
    features: []
  }];
  const FeatureCollection = jsonresponse.FeatureCollection;
  const handledResponses = [];
  if (FeatureCollection.featureMember) {
    const originalFeatureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
    let layersNames = new Set();
    originalFeatureMember.forEach((featureMember) => {
      layersNames.add(Object.keys(featureMember)[0]);
    });
    for (let layerName of layersNames) {
      jsonresponse.FeatureCollection.featureMember = originalFeatureMember.filter((feature) => {
        return feature[layerName]
      });
      const prefix = jsonresponse.FeatureCollection.featureMember[0].__prefix;
      const features = Array.isArray(jsonresponse.FeatureCollection.featureMember[0][layerName]) ? jsonresponse.FeatureCollection.featureMember[0][layerName] : [jsonresponse.FeatureCollection.featureMember[0][layerName]]
      const groupFeatures = this._groupFeaturesByFields(features);
      //check if features have different fields (multilayers)
      if (Object.keys(groupFeatures).length > 1) {
        // is a multilayers. Each feature has different fields
        this._handleWMSMultiLayersResponseFromQGISSERVER({
          groupFeatures,
          prefix,
          handledResponses,
          jsonresponse,
          layer,
          projections
        })
      } else {
        const handledResponse = this._parseLayerFeatureCollection({
          jsonresponse,
          layer,
          projections
        });
        if (handledResponse) {
          const response = handledResponse[0];
          response.layer = layerName;
          handledResponses.push(response);
        }
      }
    }
  }
  return handledResponses;
};

proto._groupFeaturesByFields = function(features) {
  return _.groupBy(features, (feature) => {
    return Object.keys(feature);
  });
};

proto._handleWMSMultiLayersResponseFromQGISSERVER = function({groupFeatures, prefix, handledResponses, jsonresponse, layer, projections} = {}){
  // is a multilayers. Each feature has different fields
  Object.keys(groupFeatures).forEach((key, index) => {
    const features = groupFeatures[key];
    jsonresponse.FeatureCollection.featureMember = {
      [`layer${index}`]: features,
      __prefix: prefix
    };
    const handledResponse = this._parseLayerFeatureCollection({
      jsonresponse,
      layer,
      projections
    });
    if (handledResponse) {
      const response = handledResponse[0];
      response.layer = layer;
      handledResponses.push(response);
    }
  });
};

proto._getHandledResponsesFromResponse = function({response, layers, projections, id=false}) {
  let multilayers = false;
  const x2js = new X2JS();
  const jsonresponse =  x2js.xml_str2json(response);
  // in case of parser return null
  if (!jsonresponse) return [{
    layer: layers[0],
    features: []
  }];
  const FeatureCollection = jsonresponse.FeatureCollection;
  const handledResponses = [];
  if (FeatureCollection.featureMember) {
    const originalFeatureMember = Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember : [FeatureCollection.featureMember];
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerName = id ? layer.getId() : `layer${i}`;
      const featureMemberArrayAndPrefix = {
        features: null,
        __prefix: null
      };
      jsonresponse.FeatureCollection.featureMember = originalFeatureMember.filter((feature) => {
        const featureMember = feature[layerName];
         if (featureMember) {
           if (Array.isArray(featureMember)){
             featureMemberArrayAndPrefix.features = featureMember;
             featureMemberArrayAndPrefix.__prefix = feature.__prefix;
             return false;
           }
           return true;
         }
      });
      if (featureMemberArrayAndPrefix.features) {
        const prefix = featureMemberArrayAndPrefix.__prefix;
        // check if features have the same fields. If not group the featues with the same fields
        const groupFeatures = this._groupFeaturesByFields(featureMemberArrayAndPrefix.features);
        //check if features have different fields (multilayers)
        if (Object.keys(groupFeatures).length > 1) {
          // is a multilayers. Each feature has different fields
          multilayers = true;
          this._handleWMSMultiLayersResponseFromQGISSERVER({
            groupFeatures,
            prefix,
            handledResponses,
            jsonresponse,
            layer,
            projections
          })
        } else {
          featureMemberArrayAndPrefix.features.forEach((feature) => {
            //for Each element have to add and object contain layerName and information, and __prefix
            jsonresponse.FeatureCollection.featureMember.push({
              [layerName]: feature,
              __prefix: prefix
            })
          });
        }
      }
      if (!multilayers) {
        const handledResponse = this._parseLayerFeatureCollection({
          jsonresponse,
          layer,
          projections
        });
        handledResponse && handledResponses.push(handledResponse[0]);
      }
    }
  }
  return handledResponses;
};

proto._handleXMLStringResponseBeforeConvertToJSON = function({response, layers, wms}) {
  if (!(typeof response === 'string'|| response instanceof String))
    response = new XMLSerializer().serializeToString(response);
  for (let i=0; i < layers.length; i++) {
    const layer = layers[i];
    let originalName = (wms && layer.isWmsUseLayerIds()) ? layer.getId(): layer.getName();
    let sanitizeLayerName = wms ? originalName.replace(/[/\s]/g, '') : originalName.replace(/[/\s]/g, '_');
    sanitizeLayerName = sanitizeLayerName.replace(/(\'+)/, '');
    sanitizeLayerName = sanitizeLayerName.replace(/(\)+)/, '');
    sanitizeLayerName = sanitizeLayerName.replace(/(\(+)/, '');
    const reg = new RegExp(`qgs:${sanitizeLayerName}\\b`, "g");
    response = response.replace(reg, `qgs:layer${i}`);
  }
  return response;
};

// digest result
proto.digestFeaturesForLayers = function(featuresForLayers) {
  let id = 0;
  let layers = [];
  let layerAttributes,
    layerTitle,
    layerId;
  featuresForLayers.forEach((featuresForLayer) => {
    featuresForLayer = featuresForLayer;
    const layer = featuresForLayer.layer;
    layerAttributes = layer.getAttributes();
    layerTitle = layer.getTitle();
    layerId = layer.getId();

    const layerObj = {
      title: layerTitle,
      id: layerId,
      attributes: [],
      features: [],
      hasgeometry: false,
      show: true,
      expandable: true,
      hasImageField: false, // check if image filed exist
      error: ''
    };

    // check if exist feature related to the layer
    if (featuresForLayer.features && featuresForLayer.features.length) {
      // get aonly attributes returned by WMS (using the first feature availble)
      layerObj.attributes = this._parseAttributes(layerAttributes, featuresForLayer.features[0].getProperties());
      // check if exist image field
      layerObj.attributes.forEach((attribute) => {
        if (attribute.type === 'image') {
          layerObj.hasImageField = true;
        }
      });
      // loop throught selected features from query result
      featuresForLayer.features.forEach((feature) => {
        const fid = feature.getId() ? feature.getId() : id;
        const geometry = feature.getGeometry();
        // check if feature has geometry
        if (geometry) {
          // set to true it used by action
          layerObj.hasgeometry = true
        }
        // create feature object
        const featureObj = {
          id: fid,
          attributes: feature.getProperties(),
          geometry: feature.getGeometry(),
          show: true
        };
        layerObj.features.push(featureObj);
        id += 1;
      });
      layers.push(layerObj);
    }
    else if (featuresForLayer.error){
      layerObj.error = featuresForLayer.error;
    }
  });
  return layers;
};

proto._parseAttributes = function(layerAttributes, featureAttributes) {
  let featureAttributesNames = _.keys(featureAttributes);
  featureAttributesNames = _.filter(featureAttributesNames,function(featureAttributesName) {
    return ['boundedBy', 'geom','the_geom','geometry','bbox', 'GEOMETRY'].indexOf(featureAttributesName) === -1;
  });
  if (layerAttributes && layerAttributes.length) {
    let featureAttributesNames = _.keys(featureAttributes);
    return _.filter(layerAttributes,function(attribute){
      return featureAttributesNames.indexOf(attribute.name) > -1;
    })
  } else {
    return _.map(featureAttributesNames, function(featureAttributesName) {
      return {
        name: featureAttributesName,
        label: featureAttributesName
      }
    })
  }
};

proto._parseLayerFeatureCollection = function({jsonresponse, layer, projections}) {
  const x2js = new X2JS();
  let layerFeatureCollectionXML = x2js.json2xml_str(jsonresponse);
  const parser = new ol.format.WMSGetFeatureInfo();
  let features = parser.readFeatures(layerFeatureCollectionXML);
  if (features.length) {
    if(!!features[0].getGeometry()) {
      const mainProjection = projections.layer ? projections.layer : projections.map;
      const invertedAxis = mainProjection.getAxisOrientation().substr(0,2) === 'ne';
      if (projections.layer && (projections.layer.getCode() !== projections.map.getCode())) {
        features.forEach((feature) => {
          const geometry = feature.getGeometry();
          feature.setGeometry(geometry.transform(projections.layer.getCode(), projections.map.getCode()))
        })
      }
      if (invertedAxis) features = this._reverseFeaturesCoordinates(features)
    }
  }
  return [{
    layer,
    features
  }]
};

proto._reverseFeaturesCoordinates = function(features) {
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    feature.setGeometry(geoutils.reverseGeometry(geometry))
  });
  return features
};

proto._parseLayermsGMLOutput = function(data) {
  const layers = this._layer.getQueryLayerOrigName();
  const parser = new ol.format.WMSGetFeatureInfo({
    layers: layers
  });
  return parser.readFeatures(data);
};

proto._parseLayerGeoJSON = function(data) {
  const geojson = new ol.format.GeoJSON({
    defaultDataProjection: this.crs,
    geometryName: "geometry"
  });
  return geojson.readFeatures(data);
};


module.exports = Provider;
