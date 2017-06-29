var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var utils = require('core/utils/utils');
var geoutils = require('core/geo/utils');
var DataProvider = require('core/layers/providers/provider');
//vado a sovrascrivere il metodo per leggere le feature
// da un geojson
var PIXEL_TOLERANCE = 10;
var GETFEATUREINFO_IMAGE_SIZE = [101, 101];

function WMSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wms';
  this._layer = options.layer || null;
  this._layerName = options.layerName || null;
  this._infoFormat = options.infoFormat || 'application/vnd.ogc.gml';
}

inherit(WMSDataProvider, DataProvider);

var proto = WMSDataProvider.prototype;

// funzione che in base ai layers e alla tipologia di servizio
// restituisce gli url per ogni layer o gruppo di layers
// che condividono lo stesso indirizzo di servizio
proto.getInfoFromLayer = function(ogcService) {
  // wfs specifica se deve essere fatta chiamata wfs o no
  // scooro sui ogni layer e catturo il queryUrl
  // se wfs prendo l'api fornite dal server
  if (ogcService == 'wfs') {
    var queryUrl = this._layer.getWmsUrl();
  } else {
    var queryUrl = this._layer.getQueryUrl();
  }
  return {
    url: queryUrl,
    infoFormat: this._layer.getInfoFormat(ogcService),
    crs: this._layer.getProjectCrs(), // dovrebbe essere comune a tutti
    serverType: this._layer.getServerType() // aggiungo anche il tipo di server
  };
};

proto._getRequestUrl = function(url, extent, size, pixelRatio, projection, params) {

  params['CRS'] = projection.getCode();

  if (!('STYLES' in params)) {
    params['STYLES'] = '';
  }

  params['DPI'] = 90 * pixelRatio;
  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];

  var axisOrientation = projection.getAxisOrientation();

  var bbox;
  if (axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  params['BBOX'] = bbox.join(',');

  return utils.appendParams(url, params);
};

// funzione che deve esserere "estratta dal mapservice"
proto._getGetFeatureInfoUrlForLayer = function(coordinates,resolution,params) {
  var url = this._layer.getQueryUrl();
  var extent = geoutils.getExtentForViewAndSize(
    coordinates, resolution, 0,
    GETFEATUREINFO_IMAGE_SIZE);

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this._layer.getName()
  };

  _.merge(baseParams, params);

  var x = Math.floor((coordinates[0] - extent[0]) / resolution);
  var y = Math.floor((extent[3] - coordinates[1]) / resolution);
  baseParams[ 'I' ] = x;
  baseParams['J'] = y;

  return this._getRequestUrl(
    url, extent, GETFEATUREINFO_IMAGE_SIZE,
    1, this._layer.getProjection(), baseParams);
};

proto.query = function(options) {
  var d = $.Deferred();
  var coordinates = options.coordinates || [];
  var urlForLayer = this.getInfoFromLayer();
  var resolution = options.resolution || null;
  var sourceParam = urlForLayer.url.split('SOURCE');
  urlForLayer.url = sourceParam[0];
  if (sourceParam.length > 1) {
    sourceParam = '&SOURCE' + sourceParam[1];
  } else {
    sourceParam = '';
  }
  var queryLayer = this._layer;
  var infoFormat = this._infoFormat;
  var params = {
    LAYERS: this._layerName,
    QUERY_LAYERS: this._layerName,
    INFO_FORMAT: infoFormat,
    FEATURE_COUNT: 10,
    // PARAMETRI DI TOLLERANZA PER QGIS SERVER
    FI_POINT_TOLERANCE: PIXEL_TOLERANCE,
    FI_LINE_TOLERANCE: PIXEL_TOLERANCE,
    FI_POLYGON_TOLERANCE: PIXEL_TOLERANCE,
    G3W_TOLERANCE: PIXEL_TOLERANCE * resolution
  };
  var getFeatureInfoUrl = this._getGetFeatureInfoUrlForLayer(coordinates, resolution, params);
  var queryString = getFeatureInfoUrl.split('?')[1];
  var url = urlForLayer.url+'?'+queryString + sourceParam;
  var queryUrlForLayer = {
    url: url,
    infoformat: infoFormat,
    queryLayer: queryLayer
  };
  this.makeQueryForLayer(queryUrlForLayer, coordinates, resolution)
    .then(function(response) {
      d.resolve(response)
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise();
};

// da verificare generalizzazione
proto.makeQueryForLayer = function(queryUrlForLayer, coordinates, resolution) {
  var d = $.Deferred();
  var queryInfo = {
    coordinates: coordinates,
    resolution: resolution
  };
  var url = queryUrlForLayer.url;
  var queryLayer = queryUrlForLayer.queryLayer;
  var infoFormat = queryUrlForLayer.infoformat;
  var postData = queryUrlForLayer.postData;
  this.doRequestAndParse({
    url: url,
    infoFormat: infoFormat,
    queryLayer: queryLayer,
    postData: postData
  })
    .then(function(response){
      d.resolve({
        data: response,
        query: queryInfo
      });
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise()
};

proto.doRequestAndParse = function(options) {
  var options = options || {};
  var url = options.url;
  var infoFormat = options.infoFormat;
  var queryLayer = options.queryLayer;
  var postData = options.postData || null;
  var self = this;
  var d = $.Deferred();
  var request;
  if (postData) {
    request = $.post(url, postData)
  } else {
    request = $.get(url);
  }
  request
    .done(function(response) {
      var featuresForLayers = self.handleQueryResponseFromServer(response, infoFormat, queryLayer);
      d.resolve(featuresForLayers);
    })
    .fail(function(){
      d.reject();
    });
  return d;
};



module.exports = WMSDataProvider;
