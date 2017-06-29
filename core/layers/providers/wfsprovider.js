var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');

function WFSDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'wfs';
};

inherit(WFSDataProvider, DataProvider);

var proto = WFSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

proto.query = function(options) {
  var self = this;
  var filter = options.filter;
  var d = $.Deferred();
  this._doRequest(filter)
    .done(function(response) {
      var allFeaturesFoLayers = [];
      var featuresForLayers = self.handleQueryResponseFromServer(response, filter.infoFormat, filter.layers, filter.ogcService);
      allFeaturesFoLayers = _.union(allFeaturesFoLayers, self.handleResponseFeaturesAndRelations(featuresForLayers));
      d.resolve({
        data: allFeaturesFoLayers
      });
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise();
};

proto._post = function(url, params) {
  url = url + '/';
  return request = $.post(url, params)

};

// get request
proto._get = function(url, params) {
  var urlParams = $.param(params);
  url = url + '?' + urlParams;
  return $.get(url)
};

proto._doRequest = function(options) {
  var options = options || {};
  var url = options.url;
  var crs = options.crs;
  var filter = options.filter;
  var infoFormat = options.infoFormat;
  var layers = options.layers;
  var layers = _.map(layers,function(layer){
    return layer.getQueryLayerName().replace(/ /g,'_');
  });

  var params = {
    SERVICE: 'WFS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeature',
    TYPENAME: layers.join(),
    OUTPUTFORMAT: infoFormat,
    SRSNAME: 'EPSG:' + crs
  };
  if (filter.bbox) {
    params.BBOX = '' + filter.bbox;
    request = this._get(url, params)

  } else {
    var geometry = filter.geometry;
    var f = ol.format.filter;
    var featureRequest = new ol.format.WFS().writeGetFeature({
      featureTypes: layers,
      filter: f.intersects('the_geom', geometry)
    });
    filter = featureRequest.children[0].innerHTML;
    params.FILTER = filter;
    request = this._post(url, params)
  }
  return request
};


module.exports = WFSDataProvider;