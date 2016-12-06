var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function QueryQGISWFSProvider() {
  base(this);
  self = this;
  // post request
  this._post = function(url, params) {
    url = url + '/';
    return request = $.post(url, params)
  };

  // get request
  this._get = function(url, params) {
    var urlParams = $.param(params);
    url = url + '?' + urlParams;
    return $.get(url)
  };

  this._doRequest = function(options) {
    var options = options || {};
    var url = options.url;
    var crs = options.crs;
    var filter = options.filter;
    var infoFormat = options.infoFormat;
    var layers = options.layers;
    var layers = _.map(layers,function(layer){
      return layer.getQueryLayerName()
    });
    var params = {
      SERVICE: 'WFS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeature',
      TYPENAME: layers.join(','),
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
  //funzione che fa la ricerca
  this.doSearch = function(options) {
   return this._doRequest(options);
  };
}

inherit(QueryQGISWFSProvider, G3WObject);

module.exports =  new QueryQGISWFSProvider;
