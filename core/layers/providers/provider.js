var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var Feature = require('core/layers/features/feature');

function DataProvider(options) {
  options = options || {};
  this._isReady = false;
  this._name = 'provider';
  base(this);
}

inherit(DataProvider, G3WObject);

var proto = DataProvider.prototype;

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

// Messo qui generale la funzione che si prende cura della trasformazione dell'xml di risposta
// dal server così da avere una risposta coerente in termini di formato risultati da presentare
// nel componente QueryResults
proto.handleQueryResponseFromServer = function(response, infoFormat, queryLayer, ogcService) {
  var jsonresponse;
  var featuresForLayers = [];
  var parser, data;
  switch (infoFormat) {
    case 'json':
      parser = this._parseLayerGeoJSON;
      data = response.vector.data;
      break;
    default:
      // caso gml
      var x2js = new X2JS();
      try {
        if (_.isString(response)) {
          jsonresponse = x2js.xml_str2json(response);
        } else {
          jsonresponse = x2js.xml2json(response);
        }
      }
      catch (e) {
        return;
      }
      var rootNode = _.keys(jsonresponse)[0];
      switch (rootNode) {
        case 'FeatureCollection':
          parser = this._parseLayerFeatureCollection;
          data = jsonresponse;
          break;
        case "msGMLOutput":
          parser = this._parseLayermsGMLOutput;
          data = response;
          break;
      }
  }
  if (parser) {
    var features = parser.call(self, queryLayer, data, ogcService);
    featuresForLayers.push({
      layer: queryLayer,
      features: features
    })
  }
  return featuresForLayers;
};

// Brutto ma per ora unica soluzione trovata per dividere per layer i risultati di un doc xml wfs.FeatureCollection.
// OL3 li parserizza tutti insieme non distinguendo le features dei diversi layers
proto._parseLayerFeatureCollection = function(queryLayer, data, ogcService) {
  var layerName = (ogcService == 'wfs') ? queryLayer.getWMSLayerName().replace(/ /g,'_'): queryLayer.getWMSLayerName().replace(/ /g,''); // QGIS SERVER rimuove gli spazi dal nome del layer per creare l'elemento FeatureMember
  var layerData = _.cloneDeep(data);
  layerData.FeatureCollection.featureMember = [];
  var featureMembers = data.FeatureCollection.featureMember;
  featureMembers = _.isArray(featureMembers) ? featureMembers : [featureMembers];
  _.forEach(featureMembers,function(featureMember){
    var isLayerMember = _.get(featureMember,layerName);
    if (isLayerMember) {
      layerData.FeatureCollection.featureMember.push(featureMember);
    }
  });
  var x2js = new X2JS();
  var layerFeatureCollectionXML = x2js.json2xml_str(layerData);
  var parser = new ol.format.WMSGetFeatureInfo();
  return parser.readFeatures(layerFeatureCollectionXML);
};

// mentre con i risultati in msGLMOutput (da Mapserver) il parser può essere istruito per parserizzare in base ad un layer di filtro
proto._parseLayermsGMLOutput = function(queryLayer, data, ogcService) {
  var layers = queryLayer.getQueryLayerOrigName();
  var parser = new ol.format.WMSGetFeatureInfo({
    layers: layers
  });
  return parser.readFeatures(data);
};


proto._parseLayerGeoJSON = function(data) {

  var geojson = new ol.format.GeoJSON({
    defaultDataProjection: this.crs,
    geometryName: "geometry"
  });
  return geojson.readFeatures(data);
};


module.exports = DataProvider;