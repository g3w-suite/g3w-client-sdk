var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');
var Filter = require('core/layers/filter/filter');

function WFSDataProvider(options) {
  options = options || {};
  base(this, options);
  this._name = 'wfs';
}

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
      var featuresForLayers = self.handleQueryResponseFromServer(response);
      d.resolve({
        data: featuresForLayers
      });
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise();
};

proto._post = function(url, params) {
  url = url + '/';
  return  $.post(url, params)

};

// get request
proto._get = function(url, params) {
  // trasformo i parametri
  var urlParams = $.param(params);
  url = url + '?' + urlParams;
  return $.get(url)
};

proto._doRequest = function(filter) {
  if (!(filter instanceof Filter)) {
    return;
  }
  var layer = this._layer;
  var url = layer.getQueryUrl();
  var crs = layer.getProjection().getCode();
  var infoFormat = layer.getInfoFormat();

  var params = {
    SERVICE: 'WFS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeature',
    TYPENAME: layer.getQueryLayerName().replace(/ /g,'_'),
    OUTPUTFORMAT: infoFormat,
    SRSNAME:  crs
  };

  var bbox = filter.getBBOX();
  if (bbox) {
    params.BBOX = bbox.join();
    request = this._get(url, params)

  } else {
    var geometry = filter.getGeometry();
    if (geometry) {
      var f = ol.format.filter;
      var featureRequest = new ol.format.WFS().writeGetFeature({
        featureTypes: [layer],
        filter: f.intersects('the_geom', geometry)
      });
      filter = featureRequest.children[0].innerHTML;
      params.FILTER = filter;
      request = this._post(url, params)
    }
  }
  return request
};


module.exports = WFSDataProvider;