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
  this._submitGetFeatureInfo = function(options) {
    var url = options.url || '';
    var layername = options.layername || null;
    var filter = options.filter || null;
    var bbox = options.bbox || ProjectsRegistry.getCurrentProject().state.extent.join(',');
    var simpleWmsSearchMaxResults = null;
    var crs = options.crs || '4326;';
    return $.get( url, {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetFeatureInfo',
        'LAYERS': layername,
        'QUERY_LAYERS': layername,
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
  this.doSearch = function(options) {
    var options = options || {};
    var d = $.Deferred();
    var layers = options.layers;
    var url = options.url;
    var crs = options.crs;
    var filterObject = options.filter;
    //creo il filtro
    // DA MIGLIORARE CASO FILTRO WMS SINGOLO LAYER / MULTIPLE LAYER
    var filter = this._createFilter(filterObject, layers[0].getQueryLayerName());
    // nel caso in cui il filtro è vuoto
    if (!filter) {
      return d.reject().promise();
    }
    //eseguo la richiesta e restituisco come risposta la promise del $.get
    var request = this._submitGetFeatureInfo({
      url: url,
      crs: crs,
      filter: filter,
      layername: layers[0].getQueryLayerName()
    });
    return request;
  };

  this._createFilter = function(filterObject, layername) {
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
                  if (!(_.isNull(v) || (_.isNaN(v) || _.trim(v) == ''))) {
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
      return  layername + ":" + createSingleFilter(filterObject);
    } else {
      return false
    }
  };
}

inherit(QueryQGISWMSProvider, G3WObject);

module.exports =  new QueryQGISWMSProvider;
