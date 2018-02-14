const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const utils = require('core/utils/utils');
const geoutils = require('g3w-ol3/src/utils/utils');
const DataProvider = require('core/layers/providers/provider');
//overwrite method to read feature
// da un geojson
const PIXEL_TOLERANCE = 10;
const GETFEATUREINFO_IMAGE_SIZE = [101, 101];

function WMSDataProvider(options) {
  options = options || {};
  base(this, options);
  this._name = 'wms';
  this._url = this._layer.getQueryUrl();
  this._layerName = this._layer.getName() || null;
  this._infoFormat = this._layer.getInfoFormat() || 'application/vnd.ogc.gml';
}

inherit(WMSDataProvider, DataProvider);

const proto = WMSDataProvider.prototype;


proto._getRequestUrl = function(url, extent, size, pixelRatio, projection, params) {
  const axisOrientation = projection.getAxisOrientation ? projection.getAxisOrientation() : "enu";
  let bbox;
  params['CRS'] = projection.getCode();
  if (!('STYLES' in params)) {
    params['STYLES'] = '';
  }

  params['DPI'] = 90 * pixelRatio;
  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];
  if (axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  params['BBOX'] = bbox.join(',');

  return utils.appendParams(url, params);
};

// exttrac from mapserveice
proto._getGetFeatureInfoUrlForLayer = function(url, coordinates,resolution, params) {
  const extent = geoutils.getExtentForViewAndSize(coordinates, resolution, 0, GETFEATUREINFO_IMAGE_SIZE);
  const baseParams = {
    'SERVICE': 'WMS',
    'VERSION': '1.3.0',
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this._layerName
  };

  _.merge(baseParams, params);

  const x = Math.floor((coordinates[0] - extent[0]) / resolution);
  const y = Math.floor((extent[3] - coordinates[1]) / resolution);
  baseParams[ 'I' ] = x;
  baseParams['J'] = y;
  return this._getRequestUrl(
    url, extent, GETFEATUREINFO_IMAGE_SIZE,
    1, this._layer.getProjection(), baseParams);
};

proto.query = function(options) {
  const d = $.Deferred();
  const coordinates = options.coordinates || [];
  const resolution = options.resolution || null;
  let url = this._url;
  let sourceParam = url.split('SOURCE');
  if (sourceParam.length) {
    url = sourceParam[0];

    if (sourceParam.length > 1) {
      sourceParam = '&SOURCE' + sourceParam[1];
    } else {
      sourceParam = '';
    }
  }
  const params = {
    LAYERS: this._layerName,
    QUERY_LAYERS: this._layerName,
    INFO_FORMAT: this._infoFormat,
    FEATURE_COUNT: 10,
    // TOLLERANCE PARAMETERS FOR QGIS
    FI_POINT_TOLERANCE: PIXEL_TOLERANCE,
    FI_LINE_TOLERANCE: PIXEL_TOLERANCE,
    FI_POLYGON_TOLERANCE: PIXEL_TOLERANCE,
    G3W_TOLERANCE: PIXEL_TOLERANCE * resolution
  };
  const getFeatureInfoUrl = this._getGetFeatureInfoUrlForLayer(url, coordinates, resolution, params);
  const queryString = getFeatureInfoUrl.split('?')[1];
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
  const d = $.Deferred();
  const queryInfo = {
    coordinates: coordinates,
    resolution: resolution
  };
  this.doRequestAndParse(url)
    .then((response) => {
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
  const d = $.Deferred();
  $.get(url)
    .then((response) => {
      const featuresForLayers = this.handleQueryResponseFromServer(this._layerName, response);
      d.resolve(featuresForLayers);
    })
    .fail(() => {
      d.reject();
    });
  return d;
};

module.exports = WMSDataProvider;
