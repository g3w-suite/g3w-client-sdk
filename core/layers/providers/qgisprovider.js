var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');

var PIXEL_TOLERANCE = 10;
var GETFEATUREINFO_IMAGE_SIZE = [101, 101];

function  QGISDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'qgis';
  this._layer = options.layer || null;
  this._layerName = options.layerName || null;
  this._infoFormat = options.infoFormat || 'application/vnd.ogc.gml';
}

inherit(QGISDataProvider, DataProvider);

var proto = QGISDataProvider.prototype;

proto.getFeatures = function(options) {
  options = options || {};
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
    crs: this._layer.getProjection().getCode(), // dovrebbe essere comune a tutti
    serverType: this._layer.getServerType() // aggiungo anche il tipo di server
  };
};

proto._getRequestUrl = function(url, extent, size, pixelRatio, projection, params) {

  ol.asserts.assert(url !== undefined, 9); // `url` must be configured or set using `#setUrl()`

  params['CRS'] = projection.getCode();

  if (!('STYLES' in params)) {
    params['STYLES'] = '';
  }

  params['DPI'] = 90 * pixelRatio;
  params['WIDTH'] = size[0];
  params['HEIGHT'] = size[1];

  var axisOrientation = projection.getAxisOrientation();
  var bbox;
  if (axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  params['BBOX'] = bbox.join(',');

  return ol.uri.appendParams(/** @type {string} */ url, params);
};

// funzione che deve esserere "estratta dal mapservice"
proto._getGetFeatureInfoUrlForLayer = function(coordinates,resolution,params) {
  var url = this._layer.getQueryUrl();
  var extent = ol.extent.getForViewAndSize(
    coordinates, resolution, 0,
    GETFEATUREINFO_IMAGE_SIZE);

  var baseParams = {
    'SERVICE': 'WMS',
    'VERSION': ol.DEFAULT_WMS_VERSION,
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': this._layer.getName()
  };

  _.merge(baseParams, params);

  var x = Math.floor((coordinates[0] - extent[0]) / resolution);
  var y = Math.floor((extent[3] - coordinates[1]) / resolution);
  baseParams[ 'I' ] = x;
  baseParams['J'] = y;

  return this._getRequestUrl(
    url, extent, GETFEATUREINFO_IMAGE_SIZE,
    1, this._layer.getProjection(), baseParams);
};

proto.query = function(options) {
  var d = $.Deferred();
  var coordinates = options.coordinates || [];
  var urlForLayer = this.getInfoFromLayer();
  var resolution = options.resolution || null;
  var queryUrlForLayer = [];
  var sourceParam = urlForLayer.url.split('SOURCE');
  urlForLayer.url = sourceParam[0];
  if (sourceParam.length > 1) {
    sourceParam = '&SOURCE' + sourceParam[1];
  } else {
    sourceParam = '';
  }
  var queryLayers = [this._layer];
  var infoFormat = this._infoFormat;
  var params = {
    LAYERS: this._layerName,
    QUERY_LAYERS: this._layerName,
    INFO_FORMAT: infoFormat,
    FEATURE_COUNT: 10,
    // PARAMETRI DI TOLLERANZA PER QGIS SERVER
    FI_POINT_TOLERANCE: PIXEL_TOLERANCE,
    FI_LINE_TOLERANCE: PIXEL_TOLERANCE,
    FI_POLYGON_TOLERANCE: PIXEL_TOLERANCE,
    G3W_TOLERANCE: PIXEL_TOLERANCE * resolution
  };
  var getFeatureInfoUrl = this._getGetFeatureInfoUrlForLayer(coordinates,resolution,params); 
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



// METODI LOADING EDITING FEATURES //

// funzione principale, starting point, chiamata dal plugin per
// il recupero dei vettoriali (chiamata verso il server)
proto.loadLayers = function(mode, customUrlParameters) {
  // il parametro mode mi di è in scrittura, lettura etc ..
  var self = this;
  var deferred = $.Deferred();
  // tiene conto dei codici dei layer che non sono stati
  // i dati vettoriali
  var noVectorlayerCodes = [];
  // setto il mode (r/w)
  this.setMode(mode);
  //verifico che ci siano parametri custom (caso di alcuni plugin) da aggiungere alla base url
  // per fare le chiamate al server
  if (customUrlParameters) {
    this._setCustomUrlParameters(customUrlParameters)
  }
  //verifica se sono stati caricati i vettoriali dei layer
  // attraverso la proprietà vector del layer passato dal plugin
  _.forEach(this._layers, function(layer, layerCode) {
    // verifico se l'attributo vector è nullo
    if (_.isNull(layer.vector)) {
      noVectorlayerCodes.push(layerCode);
    }
  });
  // eseguo le richieste delle configurazioni e mi tengo le promesse
  var vectorLayersSetup = _.map(noVectorlayerCodes, function(layerCode) {
    return self._setupVectorLayer(layerCode);
  });
  // emetto l'evento loadingvectorlayersstart (il pluginservice è in ascolto)
  self.emit('loadingvectorlayersstart');
  // aspetto tutte le promesse del setup vector
  $.when.apply(this, vectorLayersSetup)
  // una volta che tutte le configurazioni dei layer vecor
  // sono state prese dal server e dopo aver assegnato all'attributo vector
  // del layer plugin il layer vettoriale costruito con le configurazioni
  // di sopra
    .then(function() {
      // le promesse ritornano il layerCode del layer vettoriale appena costuito
      var vectorLayersCodes = Array.prototype.slice.call(arguments);
      // emtto evento che inzia il recupero dei dati dei layer vettoriali (geojson)
      self.emit('loadingvectolayersdatastart');
      // inizio a caricare tutti i vettoriali dopo aver caricato le configurazioni
      self.loadAllVectorsData(vectorLayersCodes)
        .then(function() {
          self._vectorLayersCodes = vectorLayersCodes;
          deferred.resolve(vectorLayersCodes);
          // emtto evento che ho ricevuto i layers
          self.emit('loadingvectorlayersend');
          // ora il loader è pronto
          self.setReady(true);

        })
        .fail(function() {
          // risetto tutti i layer veetotiali a null
          _.forEach(self._layers, function(layer) {
            layer.vector = null;
          });
          deferred.reject();
          // emttto che c'è stato un errore nel loading dei dati che vengono dal server
          self.emit('errorloadingvectorlayersend');
          self.setReady(false);
        })
    })
    .fail(function() {
      self.setReady(false);
      self.emit('errorloadingvectorlayersend');
      deferred.reject();
    });
  return deferred.promise();
};

proto.setVectorLayersCodes = function(vectorLayersCodes) {
  this._vectorLayersCodes = vectorLayersCodes;
};

proto.getVectorLayersCodes = function() {
  return this._vectorLayersCodes;
};

proto.getLayers = function() {
  return this._layers;
};

// funzione che fa il reload che rihiede di nuovo il dati del vetor layer
// caso in cui si lavora con un layer vettoriale e non si usa un wms per fare la query
proto.reloadVectorData = function(layerCode) {
  var self = this;
  var deferred = $.Deferred();
  var bbox = this._mapService.state.bbox;
  self._createVectorLayerFromConfig(layerCode)
    .then(function(vectorLayer) {
      self._getVectorLayerData(vectorLayer, bbox)
        .then(function(vectorDataResponse) {
          self.setVectorLayerData(vectorLayer[self._editingApiField], vectorDataResponse);
          vectorLayer.setData(vectorDataResponse.vector.data);
          deferred.resolve(vectorLayer);
        });
    });
  return deferred.promise();
};

//funzione che permette di ottenere tutti i dati relativi ai layer vettoriali caricati
//prima si è ottenuta la coinfigurazione, ora si ottengono i dati veri e propri
proto.loadAllVectorsData = function(layerCodes) {
  var self = this;
  var deferred = $.Deferred();
  var layers = this._layers;
  // verifico che il BBOX attuale non sia stato già  caricato
  // prondo il bbox
  var bbox = this._mapService.state.bbox;
  var loadedExtent = this._loadedExtent;
  if (loadedExtent && ol.extent.containsExtent(loadedExtent, bbox)) {
    return resolvedValue();
  }
  if (!loadedExtent) {
    this._loadedExtent = bbox;
  } else {
    this._loadedExtent = ol.extent.extend(loadedExtent, bbox);
  }
  if (layerCodes) {
    layers = [];
    _.forEach(layerCodes, function(layerCode) {
      layers.push(self._layers[layerCode]);
    });
  }
  //per ogni layer del plugin che non ha il layer vado a caricare i dati del layer vettoriale
  var vectorDataRequests = _.map(layers, function(Layer) {
    return self._loadVectorData(Layer.vector, bbox);
  });

  $.when.apply(this, vectorDataRequests)
    .then(function() {
      deferred.resolve(layerCodes);
    })
    .fail(function(){
      deferred.reject();
    });

  return deferred.promise();
};

proto._setCustomUrlParameters = function(customUrlParameters) {
  this._customUrlParameters = customUrlParameters;
};

proto._checkVectorGeometryTypeFromConfig = function(vectorConfig) {
  switch (vectorConfig.geometrytype) {
    case 'Line':
      vectorConfig.geometrytype = 'LineString';
      break;
    case 'MultiLine':
      vectorConfig.geometrytype = 'MultiLineString';
      break;
  }
  return vectorConfig;
};


proto._createVectorLayerFromConfig = function(layerCode) {
  var self = this;
  // recupero la configurazione del layer settata da plugin service
  var layerConfig = this._layers[layerCode];
  var deferred = $.Deferred();
  // eseguo le richieste delle configurazioni
  this._getVectorLayerConfig(layerConfig[this._editingApiField])
    .then(function(vectorConfigResponse) {
      var vectorConfig = vectorConfigResponse.vector;
      // vado a verificare la correttezza del geometryType (caso di editing generico)
      vectorConfig = self._checkVectorGeometryTypeFromConfig(vectorConfig);
      // una volta ottenuta dal server la configurazione vettoriale,
      // provvedo alla creazione del layer vettoriale
      var crsLayer = layerConfig.crs || self._mapService.getProjection().getCode();
      var vectorLayer = self._createVectorLayer({
        geometrytype: vectorConfig.geometrytype,
        format: vectorConfig.format,
        crs: self._mapService.getProjection().getCode(),
        crsLayer : crsLayer,
        id: layerConfig.id,
        name: layerConfig.name,
        pk: vectorConfig.pk,
        editing: self._editingMode
      });
      // setto i campi del layer
      vectorLayer.setFields(vectorConfig.fields);
      vectorLayer.setCrs(crsLayer);
      // questo è la proprietà della configurazione del config layer
      // che specifica se esistono relazioni con altri layer
      // sono array di oggetti che specificano una serie di
      // informazioni su come i layer sono relazionati (nome della relazione == nome layer)
      // foreign key etc ..
      var relations = vectorConfig.relations;
      // nel caso il layer abbia relazioni (array non vuoto)
      if (relations) {
        // per dire a vectorLayer che i dati
        // delle relazioni verranno caricati solo quando
        // richiesti (es. aperture form di editing)
        vectorLayer.lazyRelations = true;
        //vado a settare le relazioni del vector layer
        vectorLayer.setRelations(relations);
      }
      // setto lo stile del layer OL
      if (layerConfig.style) {
        vectorLayer.setStyle(layerConfig.style);
      }
      // risolve con il nome del vectorLayer
      deferred.resolve(vectorLayer);
    })
    .fail(function(){
      deferred.reject();
    });
  return deferred.promise();
};

// funzione che dato la configurazione del layer fornito dal plugin (style, editor, vctor etc..)
// esegue richieste al server al fine di ottenere configurazione vettoriale del layer
proto._setupVectorLayer = function(layerCode) {
  var self = this;
  var deferred = $.Deferred();
  // eseguo le richieste delle configurazioni
  this._createVectorLayerFromConfig(layerCode)
    .then(function(vectorLayer) {
      var layerConfig = self._layers[layerCode];
      // assegno il vetorLayer appena creato all'attributo vector del layer
      layerConfig.vector = vectorLayer;
      // risolve con il nome del layerCode
      deferred.resolve(layerCode);
    })
    .fail(function() {
      deferred.reject();
    });
  return deferred.promise();
};

//in base all bbox e la layer chiedo al server di restituirmi il vettoriale (geojson) del layer
proto._loadVectorData = function(vectorLayer, bbox) {
  var self = this;
  // eseguo le richieste dei dati al server al fine di ottenere il geojson,
  // vettoriale, del layer richiesto
  return self._getVectorLayerData(vectorLayer, bbox)
    .then(function(vectorDataResponse) {
      self.setVectorLayerData(vectorLayer[self._editingApiField], vectorDataResponse);
      // setto i dati vettoriali del layer vettoriale
      // e verifico se siamo in editingMode write e se ci sono featurelocks
      if (self._editingMode && vectorDataResponse.featurelocks) {
        // nel cso in cui sia in editing (mode w) e che si siano featureLocks
        // setto tale features al layervettoriale
        self.setVectorFeaturesLock(vectorLayer, vectorDataResponse.featurelocks);
      }
      //setto i dati del layer vettoriale (geojson)
      vectorLayer.setData(vectorDataResponse.vector.data);
      if (self._)
        return vectorDataResponse;
    })
    .fail(function() {
      return false;
    })
};

proto.getVectorLayerData = function(layerCode) {
  return this._vectorLayersData[layerCode];
};

proto.getVectorLayersData = function() {
  return this._vectorLayersData;
};

proto.setVectorLayerData = function(layerCode, vectorLayerData) {
  this._vectorLayersData[layerCode] = vectorLayerData;
};

//funzione che setta le features lock del layer vettoriale
proto.setVectorFeaturesLock = function(vectorLayer, featureslock) {
  //vado a pescare le fifferenze tra le featureidlock già caricati id
  var newFeaturesLockIds = _.differenceBy(featureslock, vectorLayer.getFeatureLocks(), 'featureid');
  _.forEach(newFeaturesLockIds, function(newLockId) {
    vectorLayer.addLockId(newLockId)
  });
};

proto.cleanVectorFeaturesLock = function(vectorLayer) {
  vectorLayer.cleanFeatureLocks();
};

proto.lockFeatures = function(layerName) {
  var self = this;
  var d = $.Deferred();
  var bbox = this._mapService.state.bbox;
  var vectorLayer = this._layers[layerName].vector;
  $.get(this._baseUrl+layerName+"/?lock" + this._customUrlParameters+"&in_bbox=" + bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3])
    .done(function(data) {
      self.setVectorFeaturesLock(vectorLayer, data.featurelocks);
      d.resolve(data);
    })
    .fail(function(){
      d.reject();
    });
  return d.promise();
};

// ottiene la configurazione del vettoriale
// (qui richiesto solo per la definizione degli input)
proto._getVectorLayerConfig = function(layerApiField) {
  var d = $.Deferred();
  // attravercso il layer name e il base url
  // chiedo la server di inviarmi la configurazione editing del laye
  $.get(this._baseUrl+layerApiField+"/?config"+ this._customUrlParameters)
    .done(function(data) {
      d.resolve(data);
    })
    .fail(function(){
      d.reject();
    });
  return d.promise();
};

// ottiene il vettoriale in modalità  editing
proto._getVectorLayerData = function(vectorLayer, bbox) {
  var d = $.Deferred();
  var lock = this.getMode() == 'w' ? true : false;
  var apiUrl;
  if (lock) {
    apiUrl = this._baseUrl+vectorLayer[this._editingApiField]+"/?editing";
  } else {
    apiUrl = this._baseUrl+vectorLayer[this._editingApiField]+"/?"
  }
  $.get(apiUrl + this._customUrlParameters+"&in_bbox=" + bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3])
    .done(function(data) {
      d.resolve(data);
    })
    .fail(function(){
      d.reject();
    });
  return d.promise();
};
// funzione per creare il layer vettoriale
proto._createVectorLayer = function(options) {
  var vector = new VectorLayer(options);
  return vector;
};
//funzione chiamata dal plugin quando si vuole fare un cleanUp dei layers
// !!! -- DA RIVEDERE -- !!!
proto.cleanUpLayers = function() {
  this._loadedExtent = null;
};


module.exports = QGISDataProvider;
