var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/dataproviders/dataprovider');

var PIXEL_TOLERANCE = 10;

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
  var coordinates = options.coordinates || [];
  var urlForLayer = this.getInfoFromLayer();
  var resolution = options.resolution || null;
  var epsg = this._layer.getEpsg();
  var queryUrlForLayer = [];
  var sourceParam = urlForLayer.url.split('SOURCE');
  urlForLayer.url = sourceParam[0];
  if (sourceParam.length > 1) {
    sourceParam = '&SOURCE' + sourceParam[1];
  } else {
    sourceParam = '';
  }
  var queryLayers = [this._layer];
  var infoFormat = this._layer.getInfoFormat();
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
  var url = urlForLayer.url+'?'+queryString + sourceParam;
  queryUrlForLayer.push({
    url: url,
    infoformat: infoFormat,
    queryLayers: queryLayers
  });
  this.makeQueryForLayer(queryUrlForLayer, coordinates, resolution)
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
proto.getInfoFromLayer = function(ogcService) {
  // wfs specifica se deve essere fatta chiamata wfs o no
  // scooro sui ogni layer e catturo il queryUrl
  // se wfs prendo l'api fornite dal server
  if (ogcService == 'wfs') {
    var queryUrl = this._layer.getWmsUrl();
  } else {
    var queryUrl = this._layer.getQueryUrl();
  }
  return {
      url: queryUrl,
      infoFormat: this._layer.getInfoFormat(ogcService),
      crs: this._layer.getCrs(), // dovrebbe essere comune a tutti
      serverType: this._layer.getServerType() // aggiungo anche il tipo di server
  };
};

// da verificare generalizzazione
proto.makeQueryForLayer = function(queryUrlsForLayers, coordinates, resolution) {
  var self = this;
  var d = $.Deferred();
  var queryInfo = {
    coordinates: coordinates,
    resolution: resolution
  };
  if (queryUrlsForLayers.length > 0) {
    var queryRequests = [];
    var featuresForLayers = [];
    _.forEach(queryUrlsForLayers,function(queryUrlForLayers){
      var url = queryUrlForLayers.url;
      var queryLayers = queryUrlForLayers.queryLayers;
      var infoFormat = queryUrlForLayers.infoformat;
      var postData = queryUrlForLayers.postData;
      var request = self.doRequestAndParse({
        url: url,
        infoFormat: infoFormat,
        queryLayers: queryLayers,
        postData: postData
      });
      queryRequests.push(request);
    });
    $.when.apply(this, queryRequests).
    then(function(){
      var vectorsDataResponse = Array.prototype.slice.call(arguments);
      _.forEach(vectorsDataResponse, function(_featuresForLayers){
        if(featuresForLayers){
          featuresForLayers = _.concat(featuresForLayers,_featuresForLayers);
        }
      });
      featuresForLayers = self.handleResponseFeaturesAndRelations(featuresForLayers);
      d.resolve({
        data: featuresForLayers,
        query: queryInfo
      });
    })
      .fail(function(e){
        d.reject(e);
      });
  }
  else {
    d.resolve({
      data: null,
      query: queryInfo
    });
  }
  return d.promise()
};

proto.convertG3wRelations = function(feature) {
  var g3w_relations = feature.getProperties().g3w_relations;
  var relations = null;
  if (g3w_relations) {
    relations = [];
    _.forEach(g3w_relations, function(elements, relationName) {
      relation = {};
      if (elements.length) {
        relation.name = relationName;
        relation.elements = elements;
        relations.push(relation);
      } else {
        delete g3w_relations[relationName];
      }
    });
    if (relations.length) {
      feature.set('relations', relations);
    } else {
      feature.unset('g3w_relations');
    }
  }
};

// funzione per il recupero delle relazioni della features se ci sono
// nell'attributo g3w_relations
proto.handleResponseFeaturesAndRelations = function(layersResponse) {
  var self = this;
  _.forEach(layersResponse, function(layer) {
    _.forEach(layer.features, function(feature) {
      self.convertG3wRelations(feature);
    });
  });
  return layersResponse
};

// Messo qui generale la funzione che si prende cura della trasformazione dell'xml di risposta
// dal server così da avere una risposta coerente in termini di formato risultati da presentare
// nel componente QueryResults
proto.handleQueryResponseFromServer = function(response, infoFormat, queryLayers, ogcService) {
  var jsonresponse;
  var featuresForLayers = [];
  var parser, data;
  switch (infoFormat) {
    case 'json':
      parser = this._parseLayerGeoJSON;
      data = response.vector.data;
      break;
    default:
      // caso gml
      var x2js = new X2JS();
      try {
        if (_.isString(response)) {
          jsonresponse = x2js.xml_str2json(response);
        } else {
          jsonresponse = x2js.xml2json(response);
        }
      }
      catch (e) {
        return;
      }
      var rootNode = _.keys(jsonresponse)[0];
      switch (rootNode) {
        case 'FeatureCollection':
          parser = this._parseLayerFeatureCollection;
          data = jsonresponse;
          break;
        case "msGMLOutput":
          parser = this._parseLayermsGMLOutput;
          data = response;
          break;
      }
  }
  var nfeatures = 0;
  if (parser) {
    _.forEach(queryLayers, function(queryLayer) {
      var features = parser.call(self, queryLayer, data, ogcService);
      nfeatures += features.length;
      featuresForLayers.push({
        layer: queryLayer,
        features: features
      })
    });
  }
  return featuresForLayers;
};

// Brutto ma per ora unica soluzione trovata per dividere per layer i risultati di un doc xml wfs.FeatureCollection.
// OL3 li parserizza tutti insieme non distinguendo le features dei diversi layers
proto._parseLayerFeatureCollection = function(queryLayer, data, ogcService) {
  var layerName = (ogcService == 'wfs') ? queryLayer.getWMSLayerName().replace(/ /g,'_'): queryLayer.getWMSLayerName().replace(/ /g,''); // QGIS SERVER rimuove gli spazi dal nome del layer per creare l'elemento FeatureMember
  var layerData = _.cloneDeep(data);
  layerData.FeatureCollection.featureMember = [];
  var featureMembers = data.FeatureCollection.featureMember;
  featureMembers = _.isArray(featureMembers) ? featureMembers : [featureMembers];
  _.forEach(featureMembers,function(featureMember){
    var isLayerMember = _.get(featureMember,layerName);
    if (isLayerMember) {
      layerData.FeatureCollection.featureMember.push(featureMember);
    }
  });

  var x2js = new X2JS();
  var layerFeatureCollectionXML = x2js.json2xml_str(layerData);
  var parser = new ol.format.WMSGetFeatureInfo();
  return parser.readFeatures(layerFeatureCollectionXML);
};

// mentre con i risultati in msGLMOutput (da Mapserver) il parser può essere istruito per parserizzare in base ad un layer di filtro
proto._parseLayermsGMLOutput = function(queryLayer, data, ogcService) {
  var layers = queryLayer.getQueryLayerOrigName();
  var parser = new ol.format.WMSGetFeatureInfo({
    layers: layers
  });
  return parser.readFeatures(data);
};

proto._parseLayerGeoJSON = function(queryLayer, data) {
  var geojson = new ol.format.GeoJSON({
    defaultDataProjection: this.crs,
    geometryName: "geometry"
  });
  return geojson.readFeatures(data);
};


proto.doRequestAndParse = function(options) {
  var options = options || {};
  var url = options.url;
  var infoFormat = options.infoFormat;
  var queryLayers = options.queryLayers;
  var postData = options.postData || null;
  var self = this;
  var d = $.Deferred();
  var request;
  if (postData) {
    request = $.post(url, postData)
  } else {
    request = $.get(url);
  }
  request
    .done(function(response) {
      var featuresForLayers = self.handleQueryResponseFromServer(response, infoFormat, queryLayers);
      d.resolve(featuresForLayers);
    })
    .fail(function(){
      d.reject();
    });
  return d;
};



module.exports = G3WDataProvider;
