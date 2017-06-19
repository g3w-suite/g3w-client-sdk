var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var GUI = require('gui/gui');
var DataProvider = require('core/layers/dataproviders/dataprovider');

function G3WDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'g3w';
  this._layer = options.layer || null;
}

inherit(G3WDataProvider, DataProvider);

var proto = G3WDataProvider.prototype;

proto.getFeatures = function(options) {
  options = options || {};
};

proto.query = function(options) {
  
  var d = $.Deferred();
  var mapService = GUI.getComponent('map').getService();
  var urlsForLayer = this.getInfoFromLayer();
  var resolution = mapService.getResolution();
  var epsg = mapService.getEpsg();
  var queryUrlsForLayers = [];
  _.forEach(urlsForLayers,function(urlForLayers) {
    var sourceParam = urlForLayers.url.split('SOURCE');
    urlForLayers.url = sourceParam[0];
    if (sourceParam.length > 1) {
      sourceParam = '&SOURCE' + sourceParam[1];
    } else {
      sourceParam = '';
    }
    var queryLayers = urlForLayers.layers;
    var infoFormat = queryLayers[0].getInfoFormat();
    var params = {
      LAYERS: _.map(queryLayers,function(layer){ return layer.getQueryLayerName(); }),
      QUERY_LAYERS: _.map(queryLayers,function(layer){ return layer.getQueryLayerName(); }),
      INFO_FORMAT: infoFormat,
      FEATURE_COUNT: 10,
      // PARAMETRI DI TOLLERANZA PER QGIS SERVER
      FI_POINT_TOLERANCE: PIXEL_TOLERANCE,
      FI_LINE_TOLERANCE: PIXEL_TOLERANCE,
      FI_POLYGON_TOLERANCE: PIXEL_TOLERANCE,
      G3W_TOLERANCE: PIXEL_TOLERANCE * resolution
    };
    var getFeatureInfoUrl = mapService.getGetFeatureInfoUrlForLayer(queryLayers[0],coordinates,resolution,epsg,params);
    var queryString = getFeatureInfoUrl.split('?')[1];
    var url = urlForLayers.url+'?'+queryString + sourceParam;
    queryUrlsForLayers.push({
      url: url,
      infoformat: infoFormat,
      queryLayers: queryLayers
    });
  });
  this.makeQueryForLayers(queryUrlsForLayers, coordinates, resolution)
    .then(function(response) {
      d.resolve(response)
    })
    .fail(function(e){
      d.reject(e);
    });
  return d.promise();
};

// funzione che in base ai layers e alla tipologia di servizio
// restituisce gli url per ogni layer o gruppo di layers
// che condividono lo stesso indirizzo di servizio
proto.getInfoFromLayers = function(ogcService) {
  // wfs specifica se deve essere fatta chiamata wfs o no
  var urlsForLayer;
  // scooro sui ogni layer e catturo il queryUrl
  // se wfs prendo l'api fornite dal server
  if (ogcService == 'wfs') {
    var queryUrl = this._layer.getWmsUrl();
  } else {
    var queryUrl = layer.getQueryUrl();
  }
  var urlHash = queryUrl.hashCode().toString();
  if (_.keys(urlsForLayers).indexOf(urlHash) == -1) {
    urlsForLayers[urlHash] = {
      url: queryUrl,
      layers: [],
      infoFormat: layer.getInfoFormat(ogcService),
      crs: layer.getCrs(), // dovrebbe essere comune a tutti
      serverType: layer.getServerType() // aggiungo anche il tipo di server
    };
  }
  urlsForLayers[urlHash].layers.push(layer);
  // restituisce un oggetto contente oggetti avente l'url condiviso da più layers
  return urlsForLayers;
};



module.exports = G3WDataProvider;
