var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function QueryQGISWFSProvider() {
  base(this);
  self = this;
  this.createUrlRequestAndParameters = function(queryFilterObject) {
    var url = queryFilterObject.url;
    var crs = queryFilterObject.crs;
    var filter = queryFilterObject.filter;
    var infoFormat = 'application/vnd.ogc.gml';
    var layers = queryFilterObject.layers;
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
      var urlParams = $.param(params);
      url = url + '?' + urlParams;
      request = $.get(url)
    } else {
      var geometry = filter.geometry;
      var f = ol.format.filter;
      var featureRequest = new ol.format.WFS().writeGetFeature({
        featureTypes: layers,
        filter: f.intersects('the_geom', geometry)
      });
      filter = featureRequest.children[0].innerHTML;
      params.FILTER = filter;
      url = url + '/';
      request = $.post(url, params)
    }
    return request
  };
  //funzione che fa la ricerca
  this.doSearch = function(queryFilterObject) {
   return this.createUrlRequestAndParameters(queryFilterObject);
  };
}

inherit(QueryQGISWFSProvider, G3WObject);

module.exports =  QueryQGISWFSProvider;
