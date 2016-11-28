var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var ProjectsRegistry = require('core/project/projectsregistry');

// FILTRI
var Filters = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '=<',
  LIKE: 'LIKE',
  ILIKE: 'ILIKE',
  AND: 'AND',
  OR: 'OR',
  NOT: '!='
};

function QueryQGISWMSProvider() {

  self = this;
  //funzione che fa la richiesta vera e propria al server qgis
  this.submitGetFeatureInfo = function(options) {
    var url = options.url || '';
    var querylayername = options.querylayername || null;
    var filter = options.filter || null;
    var bbox = options.bbox || ProjectsRegistry.getCurrentProject().state.extent.join(',');
    var simpleWmsSearchMaxResults = null;
    var crs = options.crs || '4326;';
    return $.get( url, {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetFeatureInfo',
        'LAYERS': querylayername,
        'QUERY_LAYERS': querylayername,
        'FEATURE_COUNT': simpleWmsSearchMaxResults ||  50,
        'INFO_FORMAT': 'application/vnd.ogc.gml',
        'CRS': 'EPSG:'+ crs,
        'FILTER': filter
        // Temporary fix for https://hub.qgis.org/issues/8656 (fixed in QGIS master)
        //'BBOX': bbox // QUI CI VA IL BBOX DELLA MAPPA
      }
    );
   };

  //funzione che fa la ricerca
  this.doSearch = function(queryFilterObject) {
    var d = $.Deferred();
    var querylayer = queryFilterObject.queryLayer;
    var url = querylayer.getQueryUrl();
    var crs = querylayer.getCrs();
    var filterObject = queryFilterObject.filterObject;
    //creo il filtro
    var filter = this.createFilter(filterObject, querylayer.getQueryLayerName());
    // nel caso in cui il filtro è vuoto
    if (!filter) {
      return d.reject().promise();
    }
    //eseguo la richiesta e restituisco come risposta la promise del $.get
    var response = this.submitGetFeatureInfo({
      url: url,
      crs: crs,
      filter: filter,
      querylayername: querylayer.getQueryLayerName()
    });
    return response;
  };

  this.createFilter = function(filterObject, querylayername) {
    /////inserisco il nome del layer (typename) ///
    var filter = [];
    function createSingleFilter(booleanObject) {
      var filterElements = [];
      var filterElement = '';
      var valueExtra = "";
      var valueQuotes = "'";
      var rootFilter;
      _.forEach(booleanObject, function(v, k, obj) {
        //creo il filtro root che sarà AND OR
        rootFilter = Filters[k];
        //qui c'è array degli elementi di un booleano
        _.forEach(v, function(input){
          //scorro su oggetto
          valueExtra = "";
          _.forEach(input, function(v, k, obj) {
          //verifico se il valore dell'oggetto è array e quindi è altro oggetto padre booleano
            if (_.isArray(v)) {
              filterElement = createSingleFilter(obj);
            } else { // è un oggetto operatore
              if (k == 'LIKE' || k == 'ILIKE') {
                valueExtra = "%";
              }
              filterOp = Filters[k];
              var value;
              _.forEach(input, function(v, k, obj) {
                _.forEach(v, function(v, k, obj) {
                  //verifico se il valore non è un numero e quindi aggiungo singolo apice
                  if (!(_.isNull(v) || (_.isNaN(v) || _.trim(v) == ''))) {;
                    filterElement = "\"" + k + "\" "+ filterOp +" " + valueQuotes + valueExtra + v + valueExtra + valueQuotes;
                    filterElements.push(filterElement);
                  }
                });
              });
            }

          });
        });
        rootFilter = (filterElements.length > 0) ? filterElements.join(" "+ rootFilter + " ") : false;
      });
      return rootFilter;
    }
    //assegno il filtro creato
    if (createSingleFilter(filterObject)) {
      return  querylayername + ":" + createSingleFilter(filterObject);
    } else {
      return false
    }
  };

  //query by Polyon
  this.queryByPolygon = function(geometry, layers) {
    var self = this;
    var d = $.Deferred();
    var f = ol.format.filter;
    var urlsForLayers = this.getUrlsForLayers(layers, true);
    var epsg = self._mapService.getEpsg();
    var resolution = self._mapService.getResolution();
    var queryUrlsForLayers = [];
    _.forEach(urlsForLayers, function (urlForLayers) {
      var queryLayers = urlForLayers.layers;
      // forzo infdo forma sempre
      var infoFormat = 'application/vnd.ogc.gml';
      var layers = _.map(queryLayers, function (layer) {
        return layer.getQueryLayerName()
      });
      var featureRequest = new ol.format.WFS().writeGetFeature({
        featureTypes: layers,
        filter: f.intersects('the_geom', geometry)
      });
      var filter = featureRequest.children[0].innerHTML;
      var layers = layers.join(',');
      var params = {
        SERVICE: 'WFS',
        VERSION: '1.3.0',
        REQUEST: 'GetFeature',
        OUTPUTFORMAT: infoFormat,
        TYPENAME: layers,
        SRSNAME: epsg,
        FILTER: filter
      };
      var url = urlForLayers.url + '/';
      queryUrlsForLayers.push({
        url: url,
        infoformat: infoFormat,
        queryLayers: queryLayers,
        postData: params
      });
    });
    this.makeQueryForLayers(queryUrlsForLayers, geometry, resolution)
      .then(function (response) {
        d.resolve(response)
      })
      .fail(function (e) {
        d.reject(e);
      })
      .always(function(){
        mapService.clearHighlightGeometry();
      });
    return d.promise();
  };

  //query by BBOX
  this.queryByBBox = function(bbox, layers) {
    var self = this;
    var d = $.Deferred();
    var urlsForLayers = this.getUrlsForLayers(layers, true);
    var epsg = self._mapService.getEpsg();
    var resolution = self._mapService.getResolution();
    var queryUrlsForLayers = [];
    _.forEach(urlsForLayers, function(urlForLayers) {
      var queryLayers = urlForLayers.layers;
      // forzo infdo forma sempre
      var infoFormat = 'application/vnd.ogc.gml';
      var layers = _.map(queryLayers,function(layer){ return layer.getQueryLayerName()});
      layers = layers.join(',');
      var params = {
        SERVICE:'WFS',
        VERSION:'1.3.0',
        REQUEST:'GetFeature',
        TYPENAME:layers,
        OUTPUTFORMAT:infoFormat,
        SRSNAME:epsg,
        BBOX:''+bbox
      };
      var urlParams = $.param(params);
      var url = urlForLayers.url + '?' + urlParams;
      queryUrlsForLayers.push({
        url: url,
        infoformat: infoFormat,
        queryLayers: queryLayers
      });
    });
    this.makeQueryForLayers(queryUrlsForLayers, bbox, resolution)
      .then(function(response) {
        d.resolve(response)
      })
      .fail(function(e){
        d.reject(e);
      });
    return d.promise();
  };

}
inherit(QueryQGISWMSProvider, G3WObject);

module.exports =  new QueryQGISWMSProvider();
