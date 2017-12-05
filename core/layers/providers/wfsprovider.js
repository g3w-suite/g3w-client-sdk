var inherit = require('core/utils/utils').inherit;
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');
var Filter = require('core/layers/filter/filter');

function WFSDataProvider(options) {
  options = options || {};
  base(this, options);
  this._name = 'wfs';
  this._layerName = this._layer.getQueryLayerName().replace(/ /g,'_');
}

inherit(WFSDataProvider, DataProvider);

var proto = WFSDataProvider.prototype;

proto.getData = function() {
  var d = $.Deferred();
  return d.promise();
};

// metodo del provider che risponde alla query del layer
proto.query = function(options) {
  var self = this;
  var filter = options.filter;
  var d = $.Deferred();
  this._doRequest(filter)
    .then(function(response) {
      var featuresForLayers = self.handleQueryResponseFromServer(self._layerName, response);
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

//funzione che si occupa di fare la richiesta al server
proto._doRequest = function(filter) {
  filter = filter || null;
  // verifico che il filtro sia istanza della classe Filter
  if (!(filter instanceof Filter)) {
    return resolve();
  }
  var layer = this._layer;
  var url = layer.getQueryUrl();
  var crs = layer.getProjection().getCode();
  var infoFormat = layer.getInfoFormat();

  var params = {
    SERVICE: 'WFS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeature',
    TYPENAME: this._layerName,
    OUTPUTFORMAT: infoFormat,
    SRSNAME:  crs
  };
  var filterType = filter.getType();
  var filter = filter.get();
  if (filter) {
    var f = ol.format.filter;
    switch (filterType) {
      case 'bbox':
        var featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: f.bbox('the_geom', filter)
        });
        break;
      case 'geometry':
        var featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: f.intersects('the_geom', filter)
        });
        break;
      case 'expression':
        var featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: null
        });
      default:
        break;
    }
    params.FILTER = featureRequest.children[0].innerHTML;
    request = this._post(url, params);
    return request
  } else {
    return reject()
  }
};


module.exports = WFSDataProvider;