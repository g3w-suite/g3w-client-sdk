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