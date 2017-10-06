var VectorParser = function() {
  // funzione che permette di recuprarer il parser addatto alla richiesta
  this.get = function(options) {
    options = options || {};
    var type = options.type;
    var parser;
    switch (type) {
      case 'json':
        parser = this._parseLayerGeoJSON;
        break;
      case 'gml':
        parser = this._parseLayermsGMLOutput;
        break;
    }
    return parser;
  };

  // Brutto ma per ora unica soluzione trovata per dividere per layer i risultati di un doc xml wfs.FeatureCollection.
  // OL3 li parserizza tutti insieme non distinguendo le features dei diversi layers
  this._parseLayerFeatureCollection = function(data, ogcService) {
    var layerName = (ogcService == 'wfs') ? this._layer.getWMSLayerName().replace(/ /g,'_'): this._layer.getWMSLayerName().replace(/ /g,''); // QGIS SERVER rimuove gli spazi dal nome del layer per creare l'elemento FeatureMember
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
  this._parseLayermsGMLOutput = function(data) {
    var layers = this._layer.getQueryLayerOrigName();
    var parser = new ol.format.WMSGetFeatureInfo({
      layers: layers
    });
    return parser.readFeatures(data);
  };
  
  this._parseLayerGeoJSON = function(data, options) {
    var crs = options.crs;
    var geojson = new ol.format.GeoJSON({
      defaultDataProjection: crs,
      geometryName: "geometry"
    });
    return geojson.readFeatures(data);
  };

};

module.exports = new VectorParser();