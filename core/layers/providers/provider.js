var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var Feature = require('core/layers/features/feature');


function Provider(options) {
  options = options || {};
  this._isReady = false;
  this._name = 'provider';
  this._layer = options.layer;
  base(this);
}

inherit(Provider, G3WObject);

var proto = Provider.prototype;

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

//serve per estrarre il gml dal multiple nel caso della regione toscana
proto.extractGML = function (response) {

  if (response.substr(0,2) != '--') {
    return response;
  }
  var gmlTag1 = new RegExp("<([^ ]*)FeatureCollection");
  var gmlTag2 = new RegExp("<([^ ]*)msGMLOutput");
  var boundary = '\r\n--';
  var parts = response.split(new RegExp(boundary));

  for (var i=0; i<parts.length; i++) {
    var part = parts[i];
    var isGmlPart = false;
    isGmlPart = part.search(gmlTag1) > -1 ? true : part.search(gmlTag2) > -1 ? true : false;
    if (isGmlPart) {
      var gml = part.substr(part.indexOf("<?xml"));
      return gml;
    }
  }
};

// Messo qui generale la funzione che si prende cura della trasformazione dell'xml di risposta
// dal server così da avere una risposta coerente in termini di formato risultati da presentare
// nel componente QueryResults
proto.handleQueryResponseFromServer = function(layerName, response) {
  let _fakeLayerName = 'layer';
  let parser;
  this._layer.getInfoFormat();
  const format = new ol.format.WMSGetFeatureInfo(({
    layers: [this._layer.getId()]
  }));
  let features = format.readFeatures(response);
  switch (this._layer.getInfoFormat()) {
    case 'json':
      parser = this._parseLayerGeoJSON;
      data = response.vector.data;
      features = parser.call(self, data, ogcservice);
      break;
    default:
      const x2js = new X2JS();
      if (!_.isString(response)) {
        // vado a convertire il tutto in stringa
        response = new XMLSerializer().serializeToString(response)
      }
      try {
        if (_.isString(response)) {
          let layerNameSanitazed = layerName.replace(/[/\s]/g, '');
          layerNameSanitazed = layerNameSanitazed.replace(')', '\\)');
          layerNameSanitazed = layerNameSanitazed.replace('(', '\\(');
          let reg = new RegExp(layerNameSanitazed, "g");
          response = response.replace(reg, _fakeLayerName);
          layerName = layerName.replace(')', '\\)');
          layerName = layerName.replace('(', '\\(');
          reg = new RegExp(layerName,"g");
          response = response.replace(reg, _fakeLayerName);
          jsonresponse = x2js.xml_str2json(response);
        } else {
          _fakeLayerName = layerName;
          jsonresponse = x2js.xml_str2json(response);
        }
      }
      catch (e) {
        return;
      }
      const rootNode = _.keys(jsonresponse)[0];
      switch (rootNode) {
        case 'FeatureCollection':
          parser = this._parseLayerFeatureCollection;
          data = jsonresponse;
          features = parser.call(self, data, _fakeLayerName);
          break;
        case "msGMLOutput":
          const layers = this._layer.getQueryLayerOrigName();
          parser = new ol.format.WMSGetFeatureInfo({
            layers: layers
          });
          features = parser.readFeatures(response);
          break;
      }
  }
  return [{
    layer: this._layer,
    features: features
  }];
};

// Brutto ma per ora unica soluzione trovata per dividere per layer i risultati di un doc xml wfs.FeatureCollection.
// OL3 li parserizza tutti insieme non distinguendo le features dei diversi layers
proto._parseLayerFeatureCollection = function(data, layerName) {
  const layerData = _.cloneDeep(data);
  layerData.FeatureCollection.featureMember = [];
  let featureMembers = data.FeatureCollection.featureMember;
  featureMembers = _.isArray(featureMembers) ? featureMembers : [featureMembers];
  _.forEach(featureMembers,function(featureMember){
    const isLayerMember = _.get(featureMember, layerName);
    if (isLayerMember) {
      layerData.FeatureCollection.featureMember.push(featureMember);
    }
  });
  const x2js = new X2JS();
  const layerFeatureCollectionXML = x2js.json2xml_str(layerData);
  const parser = new ol.format.WMSGetFeatureInfo();
  return parser.readFeatures(layerFeatureCollectionXML);
};

// mentre con i risultati in msGLMOutput (da Mapserver) il parser può essere istruito per parserizzare in base ad un layer di filtro
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
