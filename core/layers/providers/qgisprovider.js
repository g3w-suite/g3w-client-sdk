var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/providers/provider');
var Feature = require('core/layers/features/feature');


function  QGISProvider(options) {
  options = options || {};
  base(this);
  this._name = 'qgis';
  this._layer = options.layer || null;
  this._layerName = options.layerName || null;
  this._infoFormat = options.infoFormat || 'application/vnd.ogc.gml';
}

inherit(QGISProvider, DataProvider);

proto.getFeatures = function() {
  console.log('da sovrascrivere')
};



// METODI LOADING EDITING FEATURES //

proto.getFeatures = function(options) {
  var d = $.Deferred();
  options = options || {};
  var features = [];
  var featuresGeoJson = ENTIGeoJSON;
  _.forEach(this._parseLayerGeoJSON(featuresGeoJson), function(feature) {
    features.push(new Feature({
      feature: feature
    }))
  });
  d.resolve(features);
  return d.promise();
};

// METODI DEL VECCHIO EDITOR //

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


module.exports = QGISProvider;

var ENTIGeoJSON = {
  "type": "FeatureCollection",
  "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3003" } },
  "features": [
    { "type": "Feature", "properties": { "gid": 1, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "1", "am_cam_id": "1", "nome": "CASENTINO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1723520.243297379929572, 4845229.65344777982682 ] ] } },
    { "type": "Feature", "properties": { "gid": 2, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "2", "am_cam_id": "2", "nome": "PRATOMAGNO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1712658.505333, 4829966.873250789940357 ] ] } },
    { "type": "Feature", "properties": { "gid": 3, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "3", "am_cam_id": "3", "nome": "VALTIBERINA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1753621.60567691992037, 4828969.308742919936776 ] ] } },
    { "type": "Feature", "properties": { "gid": 4, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "4", "am_cam_id": "4", "nome": "CASTELLINA IN CHIANTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1684911.21800134005025, 4815562.959644709713757 ] ] } },
    { "type": "Feature", "properties": { "gid": 5, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "5", "am_cam_id": "5", "nome": "SAN QUIRICO D'ORCIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1712169.134751349920407, 4770662.078955880366266 ] ] } },
    { "type": "Feature", "properties": { "gid": 6, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "6", "am_cam_id": "6", "nome": "MURLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1694406.39198483992368, 4782312.866568639874458 ] ] } },
    { "type": "Feature", "properties": { "gid": 7, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "7", "am_cam_id": "7", "nome": "MONTICIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1677328.338403180008754, 4778658.688623270019889 ] ] } },
    { "type": "Feature", "properties": { "gid": 8, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "8", "am_cam_id": "8", "nome": "BUONCONVENTO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1701895.50073137995787, 4779181.66243883036077 ] ] } },
    { "type": "Feature", "properties": { "gid": 9, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "9", "am_cam_id": "9", "nome": "ASCIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1707861.907723299926147, 4790092.74594611953944 ] ] } },
    { "type": "Feature", "properties": { "gid": 10, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "10", "am_cam_id": "10", "nome": "CHIUSI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1740247.048921700101346, 4766895.924898349680007 ] ] } },
    { "type": "Feature", "properties": { "gid": 11, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "11", "am_cam_id": "11", "nome": "CHIANCIANO TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1730593.422915870090947, 4771235.033481759950519 ] ] } },
    { "type": "Feature", "properties": { "gid": 12, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "12", "am_cam_id": "12", "nome": "TREQUANDA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1716798.971671259962022, 4785272.235241410322487 ] ] } },
    { "type": "Feature", "properties": { "gid": 13, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "13", "am_cam_id": "13", "nome": "CHIUSDINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1669823.737861400004476, 4780151.421721699647605 ] ] } },
    { "type": "Feature", "properties": { "gid": 14, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "14", "am_cam_id": "14", "nome": "SOVICILLE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1680783.464639419922605, 4794404.789667289704084 ] ] } },
    { "type": "Feature", "properties": { "gid": 15, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "15", "am_cam_id": "15", "nome": "RADDA IN CHIANTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1692016.776902179932222, 4817593.908220710232854 ] ] } },
    { "type": "Feature", "properties": { "gid": 16, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "16", "am_cam_id": "16", "nome": "RADICONDOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1665768.493470950052142, 4791853.671191230416298 ] ] } },
    { "type": "Feature", "properties": { "gid": 17, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "17", "am_cam_id": "17", "nome": "ABBADIA SAN SALVATORE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1718680.796665739966556, 4751088.906772729940712 ] ] } },
    { "type": "Feature", "properties": { "gid": 18, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "18", "am_cam_id": "18", "nome": "MONTEPULCIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1726333.058189739938825, 4774888.675014800392091 ] ] } },
    { "type": "Feature", "properties": { "gid": 19, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "19", "am_cam_id": "19", "nome": "MONTALCINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1702774.09806304005906, 4770643.300836020149291 ] ] } },
    { "type": "Feature", "properties": { "gid": 20, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "20", "am_cam_id": "20", "nome": "CASTELNUOVO BERARDENGA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1702825.240103430114686, 4802242.926064640283585 ] ] } },
    { "type": "Feature", "properties": { "gid": 21, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "21", "am_cam_id": "21", "nome": "CASOLE D'ELSA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1665624.442152040079236, 4800624.810719270259142 ] ] } },
    { "type": "Feature", "properties": { "gid": 22, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "22", "am_cam_id": "22", "nome": "CETONA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1736615.40750929992646, 4760786.467516589909792 ] ] } },
    { "type": "Feature", "properties": { "gid": 23, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "23", "am_cam_id": "23", "nome": "MONTERIGGIONI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1679735.511786780087277, 4806871.756403059698641 ] ] } },
    { "type": "Feature", "properties": { "gid": 24, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "24", "am_cam_id": "24", "nome": "CASTIGLIONE D'ORCIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1713248.179830549983308, 4764785.87559004034847 ] ] } },
    { "type": "Feature", "properties": { "gid": 25, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "25", "am_cam_id": "25", "nome": "GAIOLE IN CHIANTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1696917.75518576009199, 4815675.541613539680839 ] ] } },
    { "type": "Feature", "properties": { "gid": 26, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "26", "am_cam_id": "26", "nome": "MONTERONI D'ARBIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1696705.396854490041733, 4789357.043639239855111 ] ] } },
    { "type": "Feature", "properties": { "gid": 27, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "27", "am_cam_id": "27", "nome": "SAN GIOVANNI D'ASSO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1710606.390525389928371, 4781048.145711150020361 ] ] } },
    { "type": "Feature", "properties": { "gid": 28, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "28", "am_cam_id": "28", "nome": "RAPOLANO TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1711303.36976227001287, 4795939.203271050006151 ] ] } },
    { "type": "Feature", "properties": { "gid": 29, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "29", "am_cam_id": "29", "nome": "RADICOFANI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1725916.79096699994989, 4753085.81937914993614 ] ] } },
    { "type": "Feature", "properties": { "gid": 30, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "30", "am_cam_id": "30", "nome": "PIANCASTAGNAIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1719985.633822479983792, 4747618.863608459942043 ] ] } },
    { "type": "Feature", "properties": { "gid": 31, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "31", "am_cam_id": "31", "nome": "PIENZA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1718139.37307652994059, 4772827.297681040130556 ] ] } },
    { "type": "Feature", "properties": { "gid": 32, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "32", "am_cam_id": "32", "nome": "SAN CASCIANO DEI BAGNI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1734892.569469979964197, 4750548.453212739899755 ] ] } },
    { "type": "Feature", "properties": { "gid": 33, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "33", "am_cam_id": "33", "nome": "TORRITA DI SIENA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1725357.685880959965289, 4783075.490489169955254 ] ] } },
    { "type": "Feature", "properties": { "gid": 34, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "34", "am_cam_id": "34", "nome": "SINALUNGA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1722346.649264289997518, 4788025.959795939736068 ] ] } },
    { "type": "Feature", "properties": { "gid": 35, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "35", "am_cam_id": "35", "nome": "SARTEANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1733863.587052129907534, 4763644.630601299926639 ] ] } },
    { "type": "Feature", "properties": { "gid": 36, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "36", "am_cam_id": "36", "nome": "POGGIBONSI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1673670.920566889923066, 4814959.417979089543223 ] ] } },
    { "type": "Feature", "properties": { "gid": 37, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "37", "am_cam_id": "37", "nome": "COLLE DI VAL D'ELSA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1671458.860459110001102, 4809808.506717859767377 ] ] } },
    { "type": "Feature", "properties": { "gid": 38, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "38", "am_cam_id": "38", "nome": "SAN GIMIGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1665301.624138159910217, 4814786.523145129904151 ] ] } },
    { "type": "Feature", "properties": { "gid": 39, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "39", "am_cam_id": "39", "nome": "SIENA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1689137.736664549913257, 4798806.567762039601803 ] ] } },
    { "type": "Feature", "properties": { "gid": 40, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "40", "am_cam_id": "40", "nome": "AMIATA SENESE", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1719437.395121149951592, 4747805.344233449548483 ] ] } },
    { "type": "Feature", "properties": { "gid": 41, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "41", "am_cam_id": "41", "nome": "VAL DI MERSE", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1665768.493470950052142, 4791853.671191230416298 ] ] } },
    { "type": "Feature", "properties": { "gid": 42, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "42", "am_cam_id": "42", "nome": "CETONA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1733870.036528970114887, 4763626.949370980262756 ] ] } },
    { "type": "Feature", "properties": { "gid": 43, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "43", "am_cam_id": "43", "nome": "SIENA", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1688915.463630859972909, 4798666.076873579993844 ] ] } },
    { "type": "Feature", "properties": { "gid": 44, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "44", "am_cam_id": "44", "nome": "PESCIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1635647.504888510098681, 4862652.653938240371644 ] ] } },
    { "type": "Feature", "properties": { "gid": 45, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "45", "am_cam_id": "45", "nome": "UZZANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1637288.415242739953101, 4860167.369695919565856 ] ] } },
    { "type": "Feature", "properties": { "gid": 46, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "46", "am_cam_id": "46", "nome": "BUGGIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1638812.488352529937401, 4860008.630827720277011 ] ] } },
    { "type": "Feature", "properties": { "gid": 47, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "47", "am_cam_id": "47", "nome": "MASSA E COZZILE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1641117.760224899975583, 4860925.483528289943933 ] ] } },
    { "type": "Feature", "properties": { "gid": 48, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "48", "am_cam_id": "48", "nome": "MONTECATINI TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1642446.45953842997551, 4860538.391247980296612 ] ] } },
    { "type": "Feature", "properties": { "gid": 49, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "49", "am_cam_id": "49", "nome": "PIEVE A NIEVOLE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1644160.679539320059121, 4859992.656011030077934 ] ] } },
    { "type": "Feature", "properties": { "gid": 50, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "50", "am_cam_id": "50", "nome": "MONSUMMANO TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1645837.5241372899618, 4859322.742167750373483 ] ] } },
    { "type": "Feature", "properties": { "gid": 51, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "51", "am_cam_id": "51", "nome": "LAMPORECCHIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1652571.873469729907811, 4853309.402236900292337 ] ] } },
    { "type": "Feature", "properties": { "gid": 52, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "52", "am_cam_id": "52", "nome": "CHIESINA UZZANESE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1638272.838373380014673, 4855478.374700150452554 ] ] } },
    { "type": "Feature", "properties": { "gid": 53, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "53", "am_cam_id": "53", "nome": "PONTE BUGGIANESE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1640506.928431909997016, 4855689.433391209691763 ] ] } },
    { "type": "Feature", "properties": { "gid": 54, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "54", "am_cam_id": "54", "nome": "PISTOIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1653981.518201479921117, 4866326.567725770175457 ] ] } },
    { "type": "Feature", "properties": { "gid": 55, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "55", "am_cam_id": "55", "nome": "SAN MARCELLO PISTOIESE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1643547.88954244996421, 4879627.211829070001841 ] ] } },
    { "type": "Feature", "properties": { "gid": 56, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "56", "am_cam_id": "56", "nome": "PITEGLIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1641636.966335789998993, 4876562.947512470185757 ] ] } },
    { "type": "Feature", "properties": { "gid": 57, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "57", "am_cam_id": "57", "nome": "MONTALE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1662288.349717430071905, 4866638.335440269671381 ] ] } },
    { "type": "Feature", "properties": { "gid": 58, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "58", "am_cam_id": "58", "nome": "CUTIGLIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1640457.424283409956843, 4884591.824804210104048 ] ] } },
    { "type": "Feature", "properties": { "gid": 59, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "59", "am_cam_id": "59", "nome": "ABETONE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1633155.132592449896038, 4889161.192516259849072 ] ] } },
    { "type": "Feature", "properties": { "gid": 60, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "60", "am_cam_id": "60", "nome": "SAMBUCA PISTOIESE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1660026.395029509905726, 4885391.944145820103586 ] ] } },
    { "type": "Feature", "properties": { "gid": 62, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "62", "am_cam_id": "62", "nome": "LARCIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1651026.161529369885102, 4854087.362791280262172 ] ] } },
    { "type": "Feature", "properties": { "gid": 63, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "63", "am_cam_id": "63", "nome": "APPENNINO PISTOIESE", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1643475.755184330046177, 4879837.942286520265043 ] ] } },
    { "type": "Feature", "properties": { "gid": 64, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "64", "am_cam_id": "64", "nome": "QUARRATA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1659071.702029139967635, 4856823.234588120132685 ] ] } },
    { "type": "Feature", "properties": { "gid": 65, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "65", "am_cam_id": "65", "nome": "PISTOIA", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1654015.934995430056006, 4866171.011545210145414 ] ] } },
    { "type": "Feature", "properties": { "gid": 66, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "66", "am_cam_id": "66", "nome": "SERRAVALLE PISTOIESE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1647203.907956159906462, 4863058.828440080396831 ] ] } },
    { "type": "Feature", "properties": { "gid": 67, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "67", "am_cam_id": "67", "nome": "AGLIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1660922.210950490087271, 4863122.500618499703705 ] ] } },
    { "type": "Feature", "properties": { "gid": 68, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "68", "am_cam_id": "68", "nome": "VERNIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1672731.9375, 4880098.5 ] ] } },
    { "type": "Feature", "properties": { "gid": 69, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "69", "am_cam_id": "69", "nome": "CANTAGALLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1668891.9375, 4877183.5 ] ] } },
    { "type": "Feature", "properties": { "gid": 70, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "70", "am_cam_id": "70", "nome": "VAIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1670347.3125, 4870594.25 ] ] } },
    { "type": "Feature", "properties": { "gid": 71, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "71", "am_cam_id": "71", "nome": "MONTEMURLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1663541.4375, 4865829.0 ] ] } },
    { "type": "Feature", "properties": { "gid": 72, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "72", "am_cam_id": "72", "nome": "PRATO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1668484.8124899999239, 4860788.75 ] ] } },
    { "type": "Feature", "properties": { "gid": 73, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "73", "am_cam_id": "73", "nome": "PRATO", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1668561.25001, 4860734.0 ] ] } },
    { "type": "Feature", "properties": { "gid": 74, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "74", "am_cam_id": "74", "nome": "POGGIO A CAIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1665395.875, 4853541.5 ] ] } },
    { "type": "Feature", "properties": { "gid": 75, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "75", "am_cam_id": "75", "nome": "CARMIGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1662347.25, 4853225.25 ] ] } },
    { "type": "Feature", "properties": { "gid": 76, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "76", "am_cam_id": "76", "nome": "VAL DI BISENZIO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1672351.104877009987831, 4879258.360874329693615 ] ] } },
    { "type": "Feature", "properties": { "gid": 77, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "77", "am_cam_id": "77", "nome": "PISA", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1612673.184794429922476, 4840667.996782300062478 ] ] } },
    { "type": "Feature", "properties": { "gid": 78, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "78", "am_cam_id": "78", "nome": "PISA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1612913.955068879993632, 4841242.789777600206435 ] ] } },
    { "type": "Feature", "properties": { "gid": 79, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "79", "am_cam_id": "79", "nome": "VECCHIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1611604.995407359907404, 4848564.07520775962621 ] ] } },
    { "type": "Feature", "properties": { "gid": 80, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "80", "am_cam_id": "80", "nome": "SAN GIULIANO TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1616195.321568720042706, 4846639.976671350188553 ] ] } },
    { "type": "Feature", "properties": { "gid": 81, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "81", "am_cam_id": "81", "nome": "BUTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1627873.504058910068125, 4842850.59750956017524 ] ] } },
    { "type": "Feature", "properties": { "gid": 82, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "82", "am_cam_id": "82", "nome": "BIENTINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1630520.392816880019382, 4840954.605 ] ] } },
    { "type": "Feature", "properties": { "gid": 83, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "83", "am_cam_id": "83", "nome": "CASTELFRANCO DI SOTTO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1640660.635253299959004, 4840008.964779789559543 ] ] } },
    { "type": "Feature", "properties": { "gid": 84, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "84", "am_cam_id": "84", "nome": "SANTA MARIA A MONTE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1636419.729919360019267, 4839681.534965540282428 ] ] } },
    { "type": "Feature", "properties": { "gid": 85, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "85", "am_cam_id": "85", "nome": "SAN MINIATO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1649322.975043809972703, 4837961.537492330186069 ] ] } },
    { "type": "Feature", "properties": { "gid": 86, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "86", "am_cam_id": "86", "nome": "VICOPISANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1627737.256037150043994, 4839752.058335459791124 ] ] } },
    { "type": "Feature", "properties": { "gid": 87, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "87", "am_cam_id": "87", "nome": "CALCINAIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1630259.078130580019206, 4837924.489161349833012 ] ] } },
    { "type": "Feature", "properties": { "gid": 88, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "88", "am_cam_id": "88", "nome": "PONTEDERA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1631892.670204879948869, 4835860.14084502030164 ] ] } },
    { "type": "Feature", "properties": { "gid": 89, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "89", "am_cam_id": "89", "nome": "MONTOPOLI IN VAL D'ARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1641959.504128250060603, 4836609.0267467899248 ] ] } },
    { "type": "Feature", "properties": { "gid": 90, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "90", "am_cam_id": "90", "nome": "PALAIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1643127.203540340065956, 4829528.789571110159159 ] ] } },
    { "type": "Feature", "properties": { "gid": 91, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "91", "am_cam_id": "91", "nome": "PONSACCO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1631814.552291929954663, 4831024.165422510355711 ] ] } },
    { "type": "Feature", "properties": { "gid": 92, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "92", "am_cam_id": "92", "nome": "CAPANNOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1634643.480640139896423, 4828105.273341829888523 ] ] } },
    { "type": "Feature", "properties": { "gid": 93, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "93", "am_cam_id": "93", "nome": "LARI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1628621.961453289957717, 4824963.825006379745901 ] ] } },
    { "type": "Feature", "properties": { "gid": 94, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "94", "am_cam_id": "94", "nome": "FAUGLIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1622439.951030780095607, 4824920.824167730286717 ] ] } },
    { "type": "Feature", "properties": { "gid": 95, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "95", "am_cam_id": "95", "nome": "CASCIANA TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1630724.782714440021664, 4820452.915422510355711 ] ] } },
    { "type": "Feature", "properties": { "gid": 96, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "96", "am_cam_id": "96", "nome": "TERRICCIOLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1635494.80603715009056, 4820471.374577489681542 ] ] } },
    { "type": "Feature", "properties": { "gid": 97, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "97", "am_cam_id": "97", "nome": "PECCIOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1639051.387298309942707, 4823124.200832270085812 ] ] } },
    { "type": "Feature", "properties": { "gid": 98, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "98", "am_cam_id": "98", "nome": "ORCIANO PISANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1622189.978527599945664, 4816710.403439120389521 ] ] } },
    { "type": "Feature", "properties": { "gid": 99, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "99", "am_cam_id": "99", "nome": "SANTA LUCE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1626689.983130580047145, 4814500.683335459791124 ] ] } },
    { "type": "Feature", "properties": { "gid": 100, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "100", "am_cam_id": "100", "nome": "CHIANNI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1632860.038962850114331, 4816103.462503190152347 ] ] } },
    { "type": "Feature", "properties": { "gid": 101, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "101", "am_cam_id": "101", "nome": "LAJATICO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1639825.754801499890164, 4815035.68 ] ] } },
    { "type": "Feature", "properties": { "gid": 102, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "102", "am_cam_id": "102", "nome": "VOLTERRA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1650601.634052539942786, 4807135.666248410008848 ] ] } },
    { "type": "Feature", "properties": { "gid": 103, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "103", "am_cam_id": "103", "nome": "CASTELLINA MARITTIMA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1627590.995627389987931, 4807779.833329079672694 ] ] } },
    { "type": "Feature", "properties": { "gid": 104, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "104", "am_cam_id": "104", "nome": "RIPARBELLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1629647.158130580093712, 4802566.255416139960289 ] ] } },
    { "type": "Feature", "properties": { "gid": 105, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "105", "am_cam_id": "105", "nome": "MONTESCUDAIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1631958.426459660055116, 4798384.388757970184088 ] ] } },
    { "type": "Feature", "properties": { "gid": 106, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "106", "am_cam_id": "106", "nome": "GUARDISTALLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1632442.955627389950678, 4796862.746248410083354 ] ] } },
    { "type": "Feature", "properties": { "gid": 107, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "107", "am_cam_id": "107", "nome": "CASALE MARITTIMO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1631073.328956469893456, 4795114.404590239748359 ] ] } },
    { "type": "Feature", "properties": { "gid": 108, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "108", "am_cam_id": "108", "nome": "MONTECATINI VAL DI CECINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1641733.246043530059978, 4805895.324218730442226 ] ] } },
    { "type": "Feature", "properties": { "gid": 109, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "109", "am_cam_id": "109", "nome": "MONTEVERDI MARITTIMO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1639413.454877529991791, 4781906.755607870407403 ] ] } },
    { "type": "Feature", "properties": { "gid": 110, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "110", "am_cam_id": "110", "nome": "POMARANCE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1652013.625633769901469, 4795862.256670920178294 ] ] } },
    { "type": "Feature", "properties": { "gid": 111, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "111", "am_cam_id": "111", "nome": "CASTELNUOVO DI VAL DI CECINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1654775.296875800006092, 4785881.275838649831712 ] ] } },
    { "type": "Feature", "properties": { "gid": 112, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "112", "am_cam_id": "112", "nome": "CASCINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1625032.001875800080597, 4837110.251670920290053 ] ] } },
    { "type": "Feature", "properties": { "gid": 113, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "113", "am_cam_id": "113", "nome": "CALCI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1622111.393202109960839, 4842551.019000539556146 ] ] } },
    { "type": "Feature", "properties": { "gid": 114, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "114", "am_cam_id": "114", "nome": "CRESPINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1626323.275768150109798, 4825758.100454020313919 ] ] } },
    { "type": "Feature", "properties": { "gid": 115, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "115", "am_cam_id": "115", "nome": "VAL DI CECINA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1652127.726037150016055, 4795628.51665817014873 ] ] } },
    { "type": "Feature", "properties": { "gid": 116, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "116", "am_cam_id": "116", "nome": "SANTA CROCE SULL'ARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1643345.760409760056064, 4841371.471037150360644 ] ] } },
    { "type": "Feature", "properties": { "gid": 117, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "117", "am_cam_id": "117", "nome": "LORENZANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1624008.1491741000209, 4821507.284378980286419 ] ] } },
    { "type": "Feature", "properties": { "gid": 118, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "118", "am_cam_id": "118", "nome": "MASSA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1591447.030883529921994, 4876584.533042400144041 ] ] } },
    { "type": "Feature", "properties": { "gid": 119, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "119", "am_cam_id": "119", "nome": "MONTIGNOSO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1594280.143014169996604, 4874530.748720490373671 ] ] } },
    { "type": "Feature", "properties": { "gid": 120, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "120", "am_cam_id": "120", "nome": "CARRARA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1587838.284448170103133, 4881082.909430590458214 ] ] } },
    { "type": "Feature", "properties": { "gid": 121, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "121", "am_cam_id": "121", "nome": "MASSA-CARRARA", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1591564.904099639970809, 4876575.838130390271544 ] ] } },
    { "type": "Feature", "properties": { "gid": 122, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "122", "am_cam_id": "122", "nome": "AULLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1577377.870550429914147, 4895571.136900080367923 ] ] } },
    { "type": "Feature", "properties": { "gid": 123, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "123", "am_cam_id": "123", "nome": "VILLAFRANCA IN LUNIGIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1575926.89218108006753, 4904816.786252699792385 ] ] } },
    { "type": "Feature", "properties": { "gid": 124, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "124", "am_cam_id": "124", "nome": "FIVIZZANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1589700.997921909904107, 4898876.27360715996474 ] ] } },
    { "type": "Feature", "properties": { "gid": 125, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "125", "am_cam_id": "125", "nome": "LUNIGIANA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1590049.982498229946941, 4899090.04442336037755 ] ] } },
    { "type": "Feature", "properties": { "gid": 126, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "126", "am_cam_id": "126", "nome": "PONTREMOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1570384.883343920111656, 4914177.049749409779906 ] ] } },
    { "type": "Feature", "properties": { "gid": 127, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "127", "am_cam_id": "127", "nome": "BAGNONE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1579350.975704269949347, 4907410.522767109796405 ] ] } },
    { "type": "Feature", "properties": { "gid": 128, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "128", "am_cam_id": "128", "nome": "TRESANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1575976.002197129884735, 4898736.718471029773355 ] ] } },
    { "type": "Feature", "properties": { "gid": 129, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "129", "am_cam_id": "129", "nome": "PODENZANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1575195.072980399942026, 4895241.473859779536724 ] ] } },
    { "type": "Feature", "properties": { "gid": 130, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "130", "am_cam_id": "130", "nome": "MULAZZO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1572370.328145769890398, 4907978.518991639837623 ] ] } },
    { "type": "Feature", "properties": { "gid": 131, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "131", "am_cam_id": "131", "nome": "ZERI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1560879.732295070076361, 4911380.281682809814811 ] ] } },
    { "type": "Feature", "properties": { "gid": 132, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "132", "am_cam_id": "132", "nome": "FILATTIERA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1574729.741139970021322, 4909133.45448071975261 ] ] } },
    { "type": "Feature", "properties": { "gid": 133, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "133", "am_cam_id": "133", "nome": "FOSDINOVO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1581541.136602309998125, 4887341.294140419922769 ] ] } },
    { "type": "Feature", "properties": { "gid": 134, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "134", "am_cam_id": "134", "nome": "LICCIANA NARDI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1582910.942747589899227, 4901864.908233949914575 ] ] } },
    { "type": "Feature", "properties": { "gid": 135, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "135", "am_cam_id": "135", "nome": "COMANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1590108.65494628995657, 4904850.381708730012178 ] ] } },
    { "type": "Feature", "properties": { "gid": 136, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "136", "am_cam_id": "136", "nome": "CASOLA IN LUNIGIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1593972.214437890099362, 4894907.469059470109642 ] ] } },
    { "type": "Feature", "properties": { "gid": 137, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "137", "am_cam_id": "137", "nome": "CAPANNORI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1626652.837900750106201, 4856365.041538080200553 ] ] } },
    { "type": "Feature", "properties": { "gid": 138, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "138", "am_cam_id": "138", "nome": "LUCCA", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1620712.145308850100264, 4855384.28273004014045 ] ] } },
    { "type": "Feature", "properties": { "gid": 139, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "139", "am_cam_id": "139", "nome": "LUCCA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1620729.968236459884793, 4855680.484546359628439 ] ] } },
    { "type": "Feature", "properties": { "gid": 140, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "140", "am_cam_id": "140", "nome": "AREA LUCCHESE", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1621086.004297150066122, 4855994.618789250031114 ] ] } },
    { "type": "Feature", "properties": { "gid": 141, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "141", "am_cam_id": "141", "nome": "PORCARI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1629966.001038539921865, 4855381.62943120021373 ] ] } },
    { "type": "Feature", "properties": { "gid": 142, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "142", "am_cam_id": "142", "nome": "MONTECARLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1634144.655250560026616, 4856634.58966008014977 ] ] } },
    { "type": "Feature", "properties": { "gid": 143, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "143", "am_cam_id": "143", "nome": "ALTOPASCIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1634721.003574440022931, 4852705.252815529704094 ] ] } },
    { "type": "Feature", "properties": { "gid": 144, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "144", "am_cam_id": "144", "nome": "VILLA BASILICA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1632071.38467384991236, 4865181.724812430329621 ] ] } },
    { "type": "Feature", "properties": { "gid": 145, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "145", "am_cam_id": "145", "nome": "PESCAGLIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1613195.337789919925854, 4869086.115485649555922 ] ] } },
    { "type": "Feature", "properties": { "gid": 146, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "146", "am_cam_id": "146", "nome": "MEDIA VALLE DEL SERCHIO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1623995.032778539927676, 4870734.099854090251029 ] ] } },
    { "type": "Feature", "properties": { "gid": 147, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "147", "am_cam_id": "147", "nome": "BORGO A MOZZANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1623821.931297139963135, 4870645.916080550290644 ] ] } },
    { "type": "Feature", "properties": { "gid": 148, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "148", "am_cam_id": "148", "nome": "CAMPORGIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1606630.79047452006489, 4890390.082841220311821 ] ] } },
    { "type": "Feature", "properties": { "gid": 149, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "149", "am_cam_id": "149", "nome": "PIEVE FOSCIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1612946.657533959951252, 4887620.818324229680002 ] ] } },
    { "type": "Feature", "properties": { "gid": 150, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "150", "am_cam_id": "150", "nome": "GARFAGNANA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1613122.422588810091838, 4884995.458524250425398 ] ] } },
    { "type": "Feature", "properties": { "gid": 151, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "151", "am_cam_id": "151", "nome": "CASTELNUOVO DI GARFAGNANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1612988.749749549897388, 4885060.421025569550693 ] ] } },
    { "type": "Feature", "properties": { "gid": 152, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "152", "am_cam_id": "152", "nome": "VIAREGGIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1600459.93873854004778, 4857870.554010599851608 ] ] } },
    { "type": "Feature", "properties": { "gid": 153, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "153", "am_cam_id": "153", "nome": "MASSAROSA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1607883.617153049912304, 4858163.804530969820917 ] ] } },
    { "type": "Feature", "properties": { "gid": 154, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "154", "am_cam_id": "154", "nome": "CAMAIORE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1604702.340030069928616, 4865888.561508730053902 ] ] } },
    { "type": "Feature", "properties": { "gid": 155, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "155", "am_cam_id": "155", "nome": "PIETRASANTA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1598478.504044049885124, 4868087.833579059690237 ] ] } },
    { "type": "Feature", "properties": { "gid": 156, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "156", "am_cam_id": "156", "nome": "FORTE DEI MARMI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1593894.608082480030134, 4867925.121220109984279 ] ] } },
    { "type": "Feature", "properties": { "gid": 157, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "157", "am_cam_id": "157", "nome": "SERVEZZA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1598517.362958240089938, 4872101.306860310025513 ] ] } },
    { "type": "Feature", "properties": { "gid": 158, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "158", "am_cam_id": "158", "nome": "STAZZEMA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1603926.765148170059547, 4872397.031294190324843 ] ] } },
    { "type": "Feature", "properties": { "gid": 159, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "159", "am_cam_id": "159", "nome": "S.ROMANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1607742.781343990005553, 4891466.545752909965813 ] ] } },
    { "type": "Feature", "properties": { "gid": 160, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "160", "am_cam_id": "160", "nome": "FOSCIANDORA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1616479.885468340013176, 4885731.218964110128582 ] ] } },
    { "type": "Feature", "properties": { "gid": 161, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "161", "am_cam_id": "161", "nome": "VAGLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1602505.231720519950613, 4885268.299742929637432 ] ] } },
    { "type": "Feature", "properties": { "gid": 162, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "162", "am_cam_id": "162", "nome": "PIAZZA AL SERCHIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1603904.699368770001456, 4893032.656330459751189 ] ] } },
    { "type": "Feature", "properties": { "gid": 163, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "163", "am_cam_id": "163", "nome": "MINUCCIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1596581.145712340017781, 4891560.040106760337949 ] ] } },
    { "type": "Feature", "properties": { "gid": 164, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "164", "am_cam_id": "164", "nome": "GIUNCUGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1600437.373227460077032, 4896790.45936574973166 ] ] } },
    { "type": "Feature", "properties": { "gid": 165, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "165", "am_cam_id": "165", "nome": "SILLANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1603866.269884899957106, 4897496.706164170056581 ] ] } },
    { "type": "Feature", "properties": { "gid": 166, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "166", "am_cam_id": "166", "nome": "CASTIGLIONE DI GARFAGNANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1612766.635213309898973, 4889355.41214369982481 ] ] } },
    { "type": "Feature", "properties": { "gid": 167, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "167", "am_cam_id": "167", "nome": "VILLA COLLEMANDINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1611714.753441520035267, 4890565.346340480260551 ] ] } },
    { "type": "Feature", "properties": { "gid": 168, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "168", "am_cam_id": "168", "nome": "CAREGGINE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1606044.452945289900526, 4886148.536839270032942 ] ] } },
    { "type": "Feature", "properties": { "gid": 169, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "169", "am_cam_id": "169", "nome": "FABBRICHE DI VALLICO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1614859.196549270069227, 4872817.190502800047398 ] ] } },
    { "type": "Feature", "properties": { "gid": 170, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "170", "am_cam_id": "170", "nome": "ALTA VERSILIA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1598252.951999079901725, 4871955.088216570205986 ] ] } },
    { "type": "Feature", "properties": { "gid": 171, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "171", "am_cam_id": "171", "nome": "COREGLIA ANT", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1622188.242029649903998, 4880177.521055379882455 ] ] } },
    { "type": "Feature", "properties": { "gid": 172, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "172", "am_cam_id": "172", "nome": "BARGA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1618921.039107309887186, 4881160.912331730127335 ] ] } },
    { "type": "Feature", "properties": { "gid": 173, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "173", "am_cam_id": "173", "nome": "GALLICANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1614986.869562489911914, 4879644.312829789705575 ] ] } },
    { "type": "Feature", "properties": { "gid": 174, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "174", "am_cam_id": "174", "nome": "BAGNI DI LUCCA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1627585.403668090002611, 4874281.343755509704351 ] ] } },
    { "type": "Feature", "properties": { "gid": 175, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "175", "am_cam_id": "175", "nome": "VERGEMOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1610724.452520549995825, 4878638.073787829838693 ] ] } },
    { "type": "Feature", "properties": { "gid": 176, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "176", "am_cam_id": "176", "nome": "MOLAZZANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1613664.72299464000389, 4880937.599321910180151 ] ] } },
    { "type": "Feature", "properties": { "gid": 177, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "177", "am_cam_id": "177", "nome": "COLLESALVETTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1619181.305995079921558, 4827319.171689379960299 ] ] } },
    { "type": "Feature", "properties": { "gid": 178, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "178", "am_cam_id": "178", "nome": "ROSIGNANO MARITTIMO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1619218.073575149988756, 4806895.27011530008167 ] ] } },
    { "type": "Feature", "properties": { "gid": 179, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "179", "am_cam_id": "179", "nome": "LIVORNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1605687.972832530038431, 4822999.112384510226548 ] ] } },
    { "type": "Feature", "properties": { "gid": 180, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "180", "am_cam_id": "180", "nome": "PIOMBINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1624641.575070390012115, 4753291.727950819768012 ] ] } },
    { "type": "Feature", "properties": { "gid": 181, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "181", "am_cam_id": "181", "nome": "SAN VINCENZO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1625192.13798926002346, 4773168.423954560421407 ] ] } },
    { "type": "Feature", "properties": { "gid": 182, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "182", "am_cam_id": "182", "nome": "CAMPIGLIA MARITTIMA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1631702.78898425004445, 4768651.382446429692209 ] ] } },
    { "type": "Feature", "properties": { "gid": 183, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "183", "am_cam_id": "183", "nome": "SUVERETO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1636693.583563060034066, 4770995.201518589630723 ] ] } },
    { "type": "Feature", "properties": { "gid": 184, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "184", "am_cam_id": "184", "nome": "CECINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1623246.766856689937413, 4796622.742006519809365 ] ] } },
    { "type": "Feature", "properties": { "gid": 185, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "185", "am_cam_id": "185", "nome": "CASTAGNETO CARDUCCI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1630926.188893300015479, 4779929.979725579731166 ] ] } },
    { "type": "Feature", "properties": { "gid": 186, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "186", "am_cam_id": "186", "nome": "CAMPO NELL'ELBA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1600975.53945926995948, 4733212.927278639748693 ] ] } },
    { "type": "Feature", "properties": { "gid": 187, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "187", "am_cam_id": "187", "nome": "PORTOFERRAIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1608845.548154330113903, 4741159.127315550111234 ] ] } },
    { "type": "Feature", "properties": { "gid": 188, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "188", "am_cam_id": "188", "nome": "CAPOLIVERI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1613014.951715969946235, 4733222.918708729557693 ] ] } },
    { "type": "Feature", "properties": { "gid": 189, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "189", "am_cam_id": "189", "nome": "CAPRAIA ISOLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1568639.506084660068154, 4766718.499997099861503 ] ] } },
    { "type": "Feature", "properties": { "gid": 190, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "190", "am_cam_id": "190", "nome": "SASSETTA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1633752.173193630063906, 4776375.433471409603953 ] ] } },
    { "type": "Feature", "properties": { "gid": 191, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "191", "am_cam_id": "191", "nome": "BIBBONA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1629761.559779789997265, 4791986.445971589535475 ] ] } },
    { "type": "Feature", "properties": { "gid": 192, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "192", "am_cam_id": "192", "nome": "MARCIANA MARINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1597868.312966350000352, 4739885.726826850324869 ] ] } },
    { "type": "Feature", "properties": { "gid": 193, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "193", "am_cam_id": "193", "nome": "RIO NELL'ELBA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1614460.979358840035275, 4741072.532927160151303 ] ] } },
    { "type": "Feature", "properties": { "gid": 194, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "194", "am_cam_id": "194", "nome": "RIO MARINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1616698.489059170009568, 4741339.416717190295458 ] ] } },
    { "type": "Feature", "properties": { "gid": 195, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "195", "am_cam_id": "195", "nome": "PORTO AZZURRO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1614471.446531800087541, 4735640.10125641990453 ] ] } },
    { "type": "Feature", "properties": { "gid": 196, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "196", "am_cam_id": "196", "nome": "MARCIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1595597.868969979928806, 4738104.241800109855831 ] ] } },
    { "type": "Feature", "properties": { "gid": 197, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "197", "am_cam_id": "197", "nome": "VAL DI CORNIA", "tipo_ente": "CIRCONDARIO" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1624694.723105439916253, 4754030.663868390023708 ] ] } },
    { "type": "Feature", "properties": { "gid": 198, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "198", "am_cam_id": "198", "nome": "ELBA - CAPRAIA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1608318.251107319956645, 4741214.467738370411098 ] ] } },
    { "type": "Feature", "properties": { "gid": 199, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "199", "am_cam_id": "199", "nome": "LIVORNO", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1605797.668891760054976, 4822986.554294340312481 ] ] } },
    { "type": "Feature", "properties": { "gid": 200, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "200", "am_cam_id": "200", "nome": "MONTEROTONDO MARITTIMO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1650937.05586871993728, 4778650.622141379863024 ] ] } },
    { "type": "Feature", "properties": { "gid": 201, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "201", "am_cam_id": "201", "nome": "MONTIERI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1664022.978010789956897, 4777311.870229190215468 ] ] } },
    { "type": "Feature", "properties": { "gid": 202, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "202", "am_cam_id": "202", "nome": "MASSA MARITTIMA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1653770.311500099953264, 4768140.390866270288825 ] ] } },
    { "type": "Feature", "properties": { "gid": 203, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "203", "am_cam_id": "203", "nome": "ROCCASTRADA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1676662.053875009994954, 4764363.699602739885449 ] ] } },
    { "type": "Feature", "properties": { "gid": 204, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "204", "am_cam_id": "204", "nome": "CIVITELLA PAGANICO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1686024.599388859933242, 4762682.710057130083442 ] ] } },
    { "type": "Feature", "properties": { "gid": 205, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "205", "am_cam_id": "205", "nome": "SEGGIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1708840.138855240074918, 4756075.875827319920063 ] ] } },
    { "type": "Feature", "properties": { "gid": 206, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "206", "am_cam_id": "206", "nome": "FOLLONICA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1643656.831952370004728, 4753685.051388800144196 ] ] } },
    { "type": "Feature", "properties": { "gid": 207, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "207", "am_cam_id": "207", "nome": "GAVORRANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1655564.147260729921982, 4754306.203466650098562 ] ] } },
    { "type": "Feature", "properties": { "gid": 208, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "208", "am_cam_id": "208", "nome": "SCARLINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1651185.829946839949116, 4752233.548912120051682 ] ] } },
    { "type": "Feature", "properties": { "gid": 209, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "209", "am_cam_id": "209", "nome": "CASTEL DEL PIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1707126.446441340027377, 4752097.220968600362539 ] ] } },
    { "type": "Feature", "properties": { "gid": 210, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "210", "am_cam_id": "210", "nome": "CINIGIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1695556.502389830071479, 4751528.542057810351253 ] ] } },
    { "type": "Feature", "properties": { "gid": 211, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "211", "am_cam_id": "211", "nome": "CAMPAGNATICO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1685804.28904937999323, 4750328.015298630110919 ] ] } },
    { "type": "Feature", "properties": { "gid": 212, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "212", "am_cam_id": "212", "nome": "ARCIDOSSO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1707401.803358729928732, 4749685.113224909640849 ] ] } },
    { "type": "Feature", "properties": { "gid": 213, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "213", "am_cam_id": "213", "nome": "SANTA FIORA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1711383.143080879934132, 4745367.592033630236983 ] ] } },
    { "type": "Feature", "properties": { "gid": 214, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "214", "am_cam_id": "214", "nome": "ROCCALBEGNA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1705130.302828839980066, 4740102.893784849904478 ] ] } },
    { "type": "Feature", "properties": { "gid": 215, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "215", "am_cam_id": "215", "nome": "GROSSETO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1672979.069017220055684, 4736365.009388989768922 ] ] } },
    { "type": "Feature", "properties": { "gid": 216, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "216", "am_cam_id": "216", "nome": "CASTELL'AZZARA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1720880.663808980025351, 4739002.497226770035923 ] ] } },
    { "type": "Feature", "properties": { "gid": 217, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "217", "am_cam_id": "217", "nome": "CASTIGLIONE DELLA PESCAIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1653756.871718500042334, 4736121.424051419831812 ] ] } },
    { "type": "Feature", "properties": { "gid": 218, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "218", "am_cam_id": "218", "nome": "SEMPRONIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1708133.77848976990208, 4734021.360460519790649 ] ] } },
    { "type": "Feature", "properties": { "gid": 219, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "219", "am_cam_id": "219", "nome": "SORANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1722385.515123290009797, 4729067.911268490366638 ] ] } },
    { "type": "Feature", "properties": { "gid": 220, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "220", "am_cam_id": "220", "nome": "SCANSANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1691185.211590609978884, 4728823.187184340320528 ] ] } },
    { "type": "Feature", "properties": { "gid": 221, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "221", "am_cam_id": "221", "nome": "PITIGLIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1718885.932760220021009, 4723765.307200520299375 ] ] } },
    { "type": "Feature", "properties": { "gid": 222, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "222", "am_cam_id": "222", "nome": "MANCIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1706460.215699800057337, 4718066.731193990446627 ] ] } },
    { "type": "Feature", "properties": { "gid": 223, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "223", "am_cam_id": "223", "nome": "MAGLIANO IN TOSCANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1688274.366381299914792, 4718725.396258629858494 ] ] } },
    { "type": "Feature", "properties": { "gid": 224, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "224", "am_cam_id": "224", "nome": "CAPALBIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1699284.578124929917976, 4702967.242187489755452 ] ] } },
    { "type": "Feature", "properties": { "gid": 225, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "225", "am_cam_id": "225", "nome": "ORBETELLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1681914.453421560116112, 4700873.708453189581633 ] ] } },
    { "type": "Feature", "properties": { "gid": 226, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "226", "am_cam_id": "226", "nome": "MONTE ARGENTARIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1674021.975126710021868, 4700737.753805629909039 ] ] } },
    { "type": "Feature", "properties": { "gid": 227, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "227", "am_cam_id": "227", "nome": "ISOLA DEL GIGLIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1656564.897025259910151, 4692171.702545559965074 ] ] } },
    { "type": "Feature", "properties": { "gid": 228, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "228", "am_cam_id": "228", "nome": "GROSSETO", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1673030.159942159894854, 4736303.672909390181303 ] ] } },
    { "type": "Feature", "properties": { "gid": 229, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "229", "am_cam_id": "229", "nome": "COLLINE METALLIFERE", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1654002.332679870072752, 4768142.371190940029919 ] ] } },
    { "type": "Feature", "properties": { "gid": 230, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "230", "am_cam_id": "230", "nome": "COLLINE DEL FIORA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1719215.693118900060654, 4723627.452061929740012 ] ] } },
    { "type": "Feature", "properties": { "gid": 231, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "231", "am_cam_id": "231", "nome": "AMIATA GROSSETANO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1707299.66945417993702, 4750317.131651679985225 ] ] } },
    { "type": "Feature", "properties": { "gid": 232, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "232", "am_cam_id": "232", "nome": "FIRENZE", "tipo_ente": "REGIONE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1681603.569170860107988, 4849371.798308770172298 ] ] } },
    { "type": "Feature", "properties": { "gid": 233, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "233", "am_cam_id": "233", "nome": "FIRENZE", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1681578.387221910059452, 4849364.21689322963357 ] ] } },
    { "type": "Feature", "properties": { "gid": 234, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "234", "am_cam_id": "234", "nome": "BAGNO A RIPOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1686778.06, 4846884.46 ] ] } },
    { "type": "Feature", "properties": { "gid": 235, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "235", "am_cam_id": "235", "nome": "BARBERINO DI MUGELLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1679508.88, 4874365.47 ] ] } },
    { "type": "Feature", "properties": { "gid": 236, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "236", "am_cam_id": "236", "nome": "BARBERINO VAL D'ELSA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1675448.42, 4823274.61 ] ] } },
    { "type": "Feature", "properties": { "gid": 237, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "237", "am_cam_id": "237", "nome": "BORGO SAN LORENZO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1691608.12, 4869643.48 ] ] } },
    { "type": "Feature", "properties": { "gid": 238, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "238", "am_cam_id": "238", "nome": "CALENZANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1674177.13, 4859257.23 ] ] } },
    { "type": "Feature", "properties": { "gid": 239, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "239", "am_cam_id": "239", "nome": "CAMPI BISENZIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1671939.7, 4854195.7 ] ] } },
    { "type": "Feature", "properties": { "gid": 240, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "240", "am_cam_id": "240", "nome": "DICOMANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1702794.09, 4862920.57 ] ] } },
    { "type": "Feature", "properties": { "gid": 241, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "241", "am_cam_id": "241", "nome": "FIESOLE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1684455.01, 4852942.35 ] ] } },
    { "type": "Feature", "properties": { "gid": 242, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "242", "am_cam_id": "242", "nome": "FIGLINE VALDARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1699606.14, 4832512.66 ] ] } },
    { "type": "Feature", "properties": { "gid": 244, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "244", "am_cam_id": "244", "nome": "FIRENZUOLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1690455.08, 4887822.56 ] ] } },
    { "type": "Feature", "properties": { "gid": 245, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "245", "am_cam_id": "245", "nome": "GREVE IN CHIANTI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1687072.02, 4828167.0 ] ] } },
    { "type": "Feature", "properties": { "gid": 246, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "246", "am_cam_id": "246", "nome": "IMPRUNETA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1681760.78, 4839460.13 ] ] } },
    { "type": "Feature", "properties": { "gid": 247, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "247", "am_cam_id": "247", "nome": "INCISA IN VAL D'ARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1697535.85, 4837432.93 ] ] } },
    { "type": "Feature", "properties": { "gid": 248, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "248", "am_cam_id": "248", "nome": "LASTRA A SIGNA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1669522.73, 4848503.62 ] ] } },
    { "type": "Feature", "properties": { "gid": 249, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "249", "am_cam_id": "249", "nome": "LONDA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1706316.89, 4859607.04 ] ] } },
    { "type": "Feature", "properties": { "gid": 250, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "250", "am_cam_id": "250", "nome": "MARRADI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1709233.89, 4883594.87 ] ] } },
    { "type": "Feature", "properties": { "gid": 251, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "251", "am_cam_id": "251", "nome": "PALAZZUOLO SUL SENIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1703942.33, 4887513.88 ] ] } },
    { "type": "Feature", "properties": { "gid": 252, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "252", "am_cam_id": "252", "nome": "PELAGO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1701352.43, 4849676.23 ] ] } },
    { "type": "Feature", "properties": { "gid": 253, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "253", "am_cam_id": "253", "nome": "PONTASSIEVE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1696391.09, 4849878.93 ] ] } },
    { "type": "Feature", "properties": { "gid": 254, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "254", "am_cam_id": "254", "nome": "REGGELLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1704459.09, 4839751.71 ] ] } },
    { "type": "Feature", "properties": { "gid": 255, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "255", "am_cam_id": "255", "nome": "RIGNANO SULL'ARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1697658.24, 4843922.95 ] ] } },
    { "type": "Feature", "properties": { "gid": 256, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "256", "am_cam_id": "256", "nome": "RUFINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1700256.95, 4855720.81 ] ] } },
    { "type": "Feature", "properties": { "gid": 257, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "257", "am_cam_id": "257", "nome": "SAN CASCIANO IN VAL DI PESA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1676203.14, 4836218.84 ] ] } },
    { "type": "Feature", "properties": { "gid": 258, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "258", "am_cam_id": "258", "nome": "SAN GODENZO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1710306.06, 4866866.94 ] ] } },
    { "type": "Feature", "properties": { "gid": 259, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "259", "am_cam_id": "259", "nome": "SAN PIERO A SIEVE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1686446.69, 4870233.26 ] ] } },
    { "type": "Feature", "properties": { "gid": 261, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "261", "am_cam_id": "261", "nome": "SCARPERIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1688866.51, 4874255.28 ] ] } },
    { "type": "Feature", "properties": { "gid": 262, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "262", "am_cam_id": "262", "nome": "SESTO FIORENTINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1676784.73, 4855597.57 ] ] } },
    { "type": "Feature", "properties": { "gid": 263, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "263", "am_cam_id": "263", "nome": "SIGNA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1668827.9, 4849871.92 ] ] } },
    { "type": "Feature", "properties": { "gid": 264, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "264", "am_cam_id": "264", "nome": "TAVARNELLE VAL DI PESA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1675502.37, 4825435.85 ] ] } },
    { "type": "Feature", "properties": { "gid": 266, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "266", "am_cam_id": "266", "nome": "VICCHIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1697906.91, 4867482.06 ] ] } },
    { "type": "Feature", "properties": { "gid": 267, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "267", "am_cam_id": "267", "nome": "MONTAGNA FIORENTINA", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1699684.475363059900701, 4855085.508449680171907 ] ] } },
    { "type": "Feature", "properties": { "gid": 268, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "268", "am_cam_id": "268", "nome": "MUGELLO", "tipo_ente": "COMUNIT MONTANA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1692139.544983749976382, 4869455.144234320148826 ] ] } },
    { "type": "Feature", "properties": { "gid": 269, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "269", "am_cam_id": "269", "nome": "FUCECCHIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1645807.685261740116403, 4843338.59123822953552 ] ] } },
    { "type": "Feature", "properties": { "gid": 270, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "270", "am_cam_id": "270", "nome": "CERRETO GUIDI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1651173.934396029915661, 4846910.570519150234759 ] ] } },
    { "type": "Feature", "properties": { "gid": 271, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "271", "am_cam_id": "271", "nome": "VINCI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1655044.823288569925353, 4850026.827965560369194 ] ] } },
    { "type": "Feature", "properties": { "gid": 272, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "272", "am_cam_id": "272", "nome": "CAPRAIA E LIMITE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1659438.181255540112033, 4845416.186024039983749 ] ] } },
    { "type": "Feature", "properties": { "gid": 273, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "273", "am_cam_id": "273", "nome": "MONTELUPO FIORENTINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1662712.802608029916883, 4843844.552130489610136 ] ] } },
    { "type": "Feature", "properties": { "gid": 274, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "274", "am_cam_id": "274", "nome": "MONTESPERTOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1667430.092589299893007, 4834423.45433853007853 ] ] } },
    { "type": "Feature", "properties": { "gid": 275, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "275", "am_cam_id": "275", "nome": "EMPOLI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1656888.50070449989289, 4842533.717008709907532 ] ] } },
    { "type": "Feature", "properties": { "gid": 276, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "276", "am_cam_id": "276", "nome": "CASTELFIORENTINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1659114.924526409944519, 4829993.864261760376394 ] ] } },
    { "type": "Feature", "properties": { "gid": 277, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "277", "am_cam_id": "277", "nome": "MONTAIONE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1654437.6095812600106, 4823952.816014179959893 ] ] } },
    { "type": "Feature", "properties": { "gid": 278, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "278", "am_cam_id": "278", "nome": "GAMBASSI TERME", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1657861.236546709900722, 4822512.301189789548516 ] ] } },
    { "type": "Feature", "properties": { "gid": 279, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "279", "am_cam_id": "279", "nome": "CERTALDO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1664890.919624810107052, 4823644.764354189857841 ] ] } },
    { "type": "Feature", "properties": { "gid": 280, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "280", "am_cam_id": "280", "nome": "CIRCONDARIO EMPOLESE-VALDELSA", "tipo_ente": "CIRCONDARIO" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1657061.878716330043972, 4842571.823530400171876 ] ] } },
    { "type": "Feature", "properties": { "gid": 281, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "281", "am_cam_id": "281", "nome": "CORTONA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1742259.86, 4795706.54 ] ] } },
    { "type": "Feature", "properties": { "gid": 282, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "282", "am_cam_id": "282", "nome": "FOIANO DELLA CHIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1728821.105, 4792708.565 ] ] } },
    { "type": "Feature", "properties": { "gid": 283, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "283", "am_cam_id": "283", "nome": "CASTIGLION FIORENTINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1737033.605, 4802913.25499999989 ] ] } },
    { "type": "Feature", "properties": { "gid": 284, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "284", "am_cam_id": "284", "nome": "MARCIANO DELLA CHIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1725998.22, 4798471.41 ] ] } },
    { "type": "Feature", "properties": { "gid": 285, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "285", "am_cam_id": "285", "nome": "MONTE SAN SAVINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1720954.065, 4801240.69 ] ] } },
    { "type": "Feature", "properties": { "gid": 286, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "286", "am_cam_id": "286", "nome": "MONTERCHI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1751676.28, 4819458.985 ] ] } },
    { "type": "Feature", "properties": { "gid": 287, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "287", "am_cam_id": "287", "nome": "ANGHIARI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1747021.935, 4825395.32 ] ] } },
    { "type": "Feature", "properties": { "gid": 288, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "288", "am_cam_id": "288", "nome": "SANSEPOLCRO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1753729.79, 4829035.15 ] ] } },
    { "type": "Feature", "properties": { "gid": 289, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "289", "am_cam_id": "289", "nome": "CIVITELLA IN VAL DI CHIANA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1724404.03, 4809340.575 ] ] } },
    { "type": "Feature", "properties": { "gid": 290, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "290", "am_cam_id": "290", "nome": "AREZZO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1733152.38, 4816687.27 ] ] } },
    { "type": "Feature", "properties": { "gid": 291, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "291", "am_cam_id": "291", "nome": "PERGINE VALDARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1717264.72, 4816587.165 ] ] } },
    { "type": "Feature", "properties": { "gid": 292, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "292", "am_cam_id": "292", "nome": "CASTIGLION FIBOCCHI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1723369.835, 4823192.535 ] ] } },
    { "type": "Feature", "properties": { "gid": 293, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "293", "am_cam_id": "293", "nome": "LATERINA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1719040.01, 4820785.41 ] ] } },
    { "type": "Feature", "properties": { "gid": 294, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "294", "am_cam_id": "294", "nome": "CAPOLONA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1730957.395, 4827388.69 ] ] } },
    { "type": "Feature", "properties": { "gid": 295, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "295", "am_cam_id": "295", "nome": "SUBBIANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1731800.26, 4828748.99 ] ] } },
    { "type": "Feature", "properties": { "gid": 296, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "296", "am_cam_id": "296", "nome": "BUCINE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1711685.365, 4817399.63 ] ] } },
    { "type": "Feature", "properties": { "gid": 297, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "297", "am_cam_id": "297", "nome": "MONTEVARCHI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1707517.68, 4822186.495 ] ] } },
    { "type": "Feature", "properties": { "gid": 298, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "298", "am_cam_id": "298", "nome": "CAVRIGLIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1701139.685, 4821835.39499999955 ] ] } },
    { "type": "Feature", "properties": { "gid": 299, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "299", "am_cam_id": "299", "nome": "TERRANUOVA BRACCIOLINI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1708912.915, 4825261.71499999985 ] ] } },
    { "type": "Feature", "properties": { "gid": 300, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "300", "am_cam_id": "300", "nome": "LORO CIUFFENNA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1712454.495, 4830085.585 ] ] } },
    { "type": "Feature", "properties": { "gid": 301, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "301", "am_cam_id": "301", "nome": "SAN GIOVANNI VALDARNO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1704364.555, 4826656.905 ] ] } },
    { "type": "Feature", "properties": { "gid": 302, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "302", "am_cam_id": "302", "nome": "PIEVE SANTO STEFANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1745244.85, 4839605.5 ] ] } },
    { "type": "Feature", "properties": { "gid": 303, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "303", "am_cam_id": "303", "nome": "SESTINO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1765684.89, 4844782.79 ] ] } },
    { "type": "Feature", "properties": { "gid": 304, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "304", "am_cam_id": "304", "nome": "BADIA TEDALDA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1756646.65, 4844481.46 ] ] } },
    { "type": "Feature", "properties": { "gid": 305, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "305", "am_cam_id": "305", "nome": "CAPRESE MICHELANGELO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1740833.8, 4836709.95 ] ] } },
    { "type": "Feature", "properties": { "gid": 306, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "306", "am_cam_id": "306", "nome": "TALLA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1724946.55, 4831459.75 ] ] } },
    { "type": "Feature", "properties": { "gid": 307, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "307", "am_cam_id": "307", "nome": "CASTEL FOCOGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1728705.52, 4837089.35 ] ] } },
    { "type": "Feature", "properties": { "gid": 260, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "260", "am_cam_id": "260", "nome": "SCANDICCI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1673835.091376014519483, 4846658.266475414857268 ] ] } },
    { "type": "Feature", "properties": { "gid": 308, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "308", "am_cam_id": "308", "nome": "CHITIGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1732292.75, 4838309.8 ] ] } },
    { "type": "Feature", "properties": { "gid": 309, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "309", "am_cam_id": "309", "nome": "BIBBIENA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1727137.625, 4841808.0 ] ] } },
    { "type": "Feature", "properties": { "gid": 310, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "310", "am_cam_id": "310", "nome": "ORTIGNANO RAGGIOLO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1721892.3, 4840200.15 ] ] } },
    { "type": "Feature", "properties": { "gid": 311, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "311", "am_cam_id": "311", "nome": "CHIUSI DELLA VERNA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1736484.52, 4842753.43 ] ] } },
    { "type": "Feature", "properties": { "gid": 312, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "312", "am_cam_id": "312", "nome": "POPPI", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1722787.665, 4844874.375 ] ] } },
    { "type": "Feature", "properties": { "gid": 313, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "313", "am_cam_id": "313", "nome": "CASTEL SAN NICCOL", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1717872.475, 4846782.84499999974 ] ] } },
    { "type": "Feature", "properties": { "gid": 314, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "314", "am_cam_id": "314", "nome": "STIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1717925.385, 4853100.09 ] ] } },
    { "type": "Feature", "properties": { "gid": 315, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "315", "am_cam_id": "315", "nome": "PRATOVECCHIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1718984.7, 4852103.48 ] ] } },
    { "type": "Feature", "properties": { "gid": 316, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "316", "am_cam_id": "316", "nome": "CASTELFRANCO DI SOPRA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1706127.95, 4832965.8 ] ] } },
    { "type": "Feature", "properties": { "gid": 317, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "317", "am_cam_id": "317", "nome": "MONTEMIGNAIO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1710986.467297950061038, 4846341.57 ] ] } },
    { "type": "Feature", "properties": { "gid": 318, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "318", "am_cam_id": "318", "nome": "PIAN DI SC", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1705488.65, 4835211.65 ] ] } },
    { "type": "Feature", "properties": { "gid": 319, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "319", "am_cam_id": "319", "nome": "LUCIGNANO", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1722875.335, 4795008.775 ] ] } },
    { "type": "Feature", "properties": { "gid": 320, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "320", "am_cam_id": "320", "nome": "AREZZO", "tipo_ente": "PROVINCIA" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1733221.826634859899059, 4816678.425567770376801 ] ] } },
    { "type": "Feature", "properties": { "gid": 265, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "265", "am_cam_id": "265", "nome": "VAGLIA", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1686501.752689821412787, 4862889.187600770033896 ] ] } },
    { "type": "Feature", "properties": { "gid": 243, "area": 0.000000, "perimeter": 0.000000, "am_cam_": "243", "am_cam_id": "243", "nome": "FIRENZE", "tipo_ente": "COMUNE" }, "geometry": { "type": "MultiPoint", "coordinates": [ [ 1681145.353114033350721, 4848869.348600102588534 ] ] } }
  ]
};