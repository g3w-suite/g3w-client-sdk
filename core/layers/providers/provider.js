const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const geoutils = require('g3w-ol3/src/utils/utils');
const G3WObject = require('core/g3wobject');

function Provider(options = {}) {
  const ProjectsRegistry = require('core/project/projectsregistry');
  ProjectsRegistry.onafter('setCurrentProject', (project) => {
    this._ows_method = project.getOwsMethod();
  });
  this._isReady = false;
  this._name = 'provider';
  this._layer = options.layer;
  this._ows_method = 'GET';
  base(this);
}

inherit(Provider, G3WObject);

const proto = Provider.prototype;

proto.getOwsMethod = function() {
  return this._ows_method;
};

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
  console.log('deve essere implementatato dai singoli provider');
};

proto.getName = function() {
  return this._name;
};

// to extract gml from multiple (Tuscany region)
proto.extractGML = function (response) {
  if (response.substr(0,2) != '--') {
    return response;
  }
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
  let parser;
  const format = new ol.format.WMSGetFeatureInfo(({
    layers: [layer.getId()]
  }));
  let features = format.readFeatures(response);
  switch (layer.getInfoFormat()) {
    case 'json':
      parser = this._parseLayerGeoJSON;
      data = response.vector.data;
      features = parser.call(this, data, ogcservice);
      break;
    default:
      const x2js = new X2JS();
      if (!_.isString(response))
        response = new XMLSerializer().serializeToString(response);
      try {
        if (_.isString(response)) {
          // check if contain msGMLOutput
          if (!/msGMLOutput/.test(response)) {
            layerName = wms ? layerName.replace(/[/\s]/g, '') : layerName.replace(/[/\s]/g, '_') ;
            layerName = layerName.replace(/(\'+)/, '');
            layerName = layerName.replace(/(\)+)/, '');
            layerName = layerName.replace(/(\(+)/, '');
            let reg = new RegExp(`qgs:${layerName}\\b`, "g");
            const fakeName = `g3wlayer${layerName}`;
            response = response.replace(reg, `qgs:${fakeName}`);
            //other layer evantually with name starting with numerber
            response = response.replace(/qgs:[0-9]+/g, 'qgs:otherLayer');
            jsonresponse = x2js.xml_str2json(response);
            const FeatureCollection = jsonresponse.FeatureCollection;
            if (FeatureCollection && FeatureCollection.featureMember)
              FeatureCollection.featureMember =  Array.isArray(FeatureCollection.featureMember) ? FeatureCollection.featureMember.filter((feature) => {
                return feature[fakeName];
              }) : FeatureCollection.featureMember[fakeName] ? [FeatureCollection.featureMember] : [];
            else
              FeatureCollection.featureMember  = [];
          } else {
            jsonresponse = x2js.xml_str2json(response);
          }
        }
      } catch (error) {
        return;
      }
      const rootNode = _.keys(jsonresponse)[0];
      switch (rootNode) {
        case 'FeatureCollection':
          parser = this._parseLayerFeatureCollection;
          data = jsonresponse;
          features = parser.call(this, data, layerName, projections);
          break;
        case "msGMLOutput":
          const layers = layer.getQueryLayerOrigName();
          parser = new ol.format.WMSGetFeatureInfo({
            layers: layers
          });
          features = parser.readFeatures(response);
          break;
      }
  }
  return [{
    layer,
    features
  }];
};

// Method to transform xml from server to present to queryreult component
proto.handleQueryResponseFromServer = function(response, projections, layers, wms=true) {
  if (layers) {
    const handledResponses = [];
    for (let i=0; i < layers.length; i++) {
      const layer = layers[i];
      let handledResponse = this.handleQueryResponseFromServerSingleLayer(layer, response, projections, wms);
      if (handledResponse)
        handledResponses.push(handledResponse[0]);
    }
    return handledResponses;
  }
  else
    return this.handleQueryResponseFromServerSingleLayer(this._layer, response, projections, wms);
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
  }
  // if layer.attribute is empty (for exaple remote layer)
  // build a fake structure using attribute as label as name
  else {
    return _.map(featureAttributesNames, function(featureAttributesName) {
      return {
        name: featureAttributesName,
        label: featureAttributesName
      }
    })
  }
};

proto._parseLayerFeatureCollection = function(data, layerName, projections) {
  const x2js = new X2JS();
  let layerFeatureCollectionXML = x2js.json2xml_str(data);
  const parser = new ol.format.WMSGetFeatureInfo();
  const mainProjection = projections.layer ? projections.layer : projections.map;
  let invertedAxis = mainProjection.getAxisOrientation().substr(0,2) == 'ne';
  let features = parser.readFeatures(layerFeatureCollectionXML);
  if (features.length && !!features[0].getGeometry()) {
    if (projections.layer && (projections.layer.getCode() !== projections.map.getCode())) {
      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        feature.setGeometry(geometry.transform(projections.layer.getCode(), projections.map.getCode()))
      })
    }
    if (invertedAxis)
      features = this._reverseFeaturesCoordinates(features)
  }
  return features
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
