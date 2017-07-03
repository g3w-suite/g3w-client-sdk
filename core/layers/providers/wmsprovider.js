var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var utils = require('core/utils/utils');
var geoutils = require('g3w-ol3/src/utils/utils');
var DataProvider = require('core/layers/providers/provider');
//vado a sovrascrivere il metodo per leggere le feature
// da un geojson
var PIXEL_TOLERANCE = 10;
var GETFEATUREINFO_IMAGE_SIZE = [101, 101];

function WMSDataProvider(options) {
  options = options || {};
  base(this, options);
  this._name = 'wms';
  this._url = this._layer.getQueryUrl();
  this._layerName = this._layer.getName() || null; // prendo sempre il name del layer di QGIS, perché le query sono proxate e gestite da g3w-server
  this._infoFormat = this._layer.getInfoFormat() || 'application/vnd.ogc.gml';
}

inherit(WMSDataProvider, DataProvider);

var proto = WMSDataProvider.prototype;


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
proto._getGetFeatureInfoUrlForLayer = function(url, coordinates,resolution,params) {
  var extent = geoutils.getExtentForViewAndSize(
    coordinates, resolution, 0,
    GETFEATUREINFO_IMAGE_SIZE);

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': '1.3.0',
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
  var resolution = options.resolution || null;
  var url = this._url;
  var sourceParam = url.split('SOURCE');
  if (sourceParam.length) {
    url = sourceParam[0];
    
    if (sourceParam.length > 1) {
      sourceParam = '&SOURCE' + sourceParam[1];
    } else {
      sourceParam = '';
    }
  }
  
  var params = {
    LAYERS: this._layerName,
    QUERY_LAYERS: this._layerName,
    INFO_FORMAT: this._infoFormat,
    FEATURE_COUNT: 10,
    // PARAMETRI DI TOLLERANZA PER QGIS SERVER
    FI_POINT_TOLERANCE: PIXEL_TOLERANCE,
    FI_LINE_TOLERANCE: PIXEL_TOLERANCE,
    FI_POLYGON_TOLERANCE: PIXEL_TOLERANCE,
    G3W_TOLERANCE: PIXEL_TOLERANCE * resolution
  };
  var getFeatureInfoUrl = this._getGetFeatureInfoUrlForLayer(url, coordinates, resolution, params);
  var queryString = getFeatureInfoUrl.split('?')[1];
  url += '?'+queryString + sourceParam;

  this.makeQueryForLayer(url, coordinates, resolution)
    .then(function(response) {
      d.resolve(response)
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise();
};

proto.makeQueryForLayer = function(url, coordinates, resolution) {
  var d = $.Deferred();
  var queryInfo = {
    coordinates: coordinates,
    resolution: resolution
  };
  this.doRequestAndParse(url)
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

proto.doRequestAndParse = function(url) {
  var self = this;
  var d = $.Deferred();
  $.get(url)
    .done(function(response) {
      var featuresForLayers = self.handleQueryResponseFromServer(response, this._infoFormat, this._layerName);
      d.resolve(featuresForLayers);
    })
    .fail(function(){
      d.reject();
    });
  return d;
};



module.exports = WMSDataProvider;
