var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var ProviderFactory = require('core/layers/providers/providersfactory');

// classe padre di tutti i Layer
function Layer(config) {
  config = config || {};
  // contiene la configurazione statica del layer
  // messo merge perchè deve eventualmente mergiare attributi in comune
  this.config = _.merge({
    id: config.id || 'Layer' ,
    title: config.title  || null,
    name: config.name || null,
    origname: config.origname || null,
    capabilities: config.capabilities || null,
    editops: config.editops || null,
    infoformat: config.infoformat || null,
    servertype: config.servertype || null,
    source: config.source || null,
    geolayer: false,
    fields: config.fields || {},
    urls: {
      query: config.infourl && config.infour != '' || config.wmsUrl
    }
  }, config);

  // contiene la parte dinamica del layer
  //this.state = config; // questo fa in modo che il catalog reagisca al mutamento
  // delle proprietà dinamiche (select, disable, visible)
  this.state = {
    id: config.id,
    title: config.name,
    visible: config.visible,
    selected: config.selected | false,
    disabled: config.disabled | false,
    hidden: config.hidden || false
  };
  // tipo di server
  var serverType = this.config.servertype;
  // tipo di sorgente del layer
  var sourceType = this.config.source ? this.config.source.type : null ;
  // vado a fare riferimento al suo contenitore (layersstore);
  this._layersstore = config.layersstore || null;
  /*
    questi sono i providers che il layer ha per
    la gestione di una query semplice, query che utilizza filtri e recupero dei
    dati grezzi del layer. Tutto è delegato ai sui providers
    Esistono tre tipi di provider:
      1 - query
      2 - filter
      3 - data -- utilizzato quando dobbiamo recupeare i dati grezzi del layer (esempio editing)
   */
  if (serverType && sourceType)
    this.providers = {
      query: ProviderFactory.build('query', serverType, sourceType, {
        layer: this
      }),
      filter: ProviderFactory.build('filter', serverType, sourceType, {
        layer: this
      }),
      search: ProviderFactory.build('search', serverType, sourceType, {
        layer: this
      }),
      data: ProviderFactory.build('data', serverType, sourceType, {
        layer: this
      })
    };

  base(this);
}

inherit(Layer, G3WObject);

var proto = Layer.prototype;


//metodo search
proto.search = function(options) {
  options = options || {};
  var d = $.Deferred();
  var provider = this.getProvider('search');
  if (provider) {
    provider.query(options)
      .done(function(response) {
        d.resolve(response);
      })
      .fail(function(err) {
        d.reject(err);
      });
  } else {
    d.reject('Il layer non è searchable');
  }
  return d.promise();
};

// metodo che server a recupere informazioni del layer
// vinene chiamato solo nei layers che sono interroabili
proto.query = function(options) {
  options = options || {};
  var d = $.Deferred();
  // prendo come provider di default il provider query
  var provider = this.getProvider('query');
  // nel caso in cui nell'opzioni della query ho passato il parametro filtro
  if (options.filter) {
    provider = this.providers.filter;
  }
  // solo nel caso in cui sia stato istanziato un provider
  if (provider) {
    provider.query(options)
      .done(function(response) {
        d.resolve(response);
      })
      .fail(function(err) {
        d.reject(err);
      });
  } else {
    d.reject('Il layer non è interrogabile');
  }
  return d.promise();
};

proto.getProject = function() {
  return this.config.project;
};

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
};

proto.getEditingLayer = function() {
  return self;
};

proto.isHidden = function() {
  return this.state.hidden;
};

proto.setHidden = function(bool) {
  this.state.hidden = _.isBoolean(bool) ? bool: true;
};

proto.isModified = function() {
  //medodo che stbilisce se modificato o no
  return this.state.modified;
};

proto.getId = function() {
  return this.config.id;
};

proto.getTitle = function() {
  return this.config.title;
};

proto.getName = function() {
  return this.config.name;
};

proto.getOrigName = function() {
  return this.config.origname;
};

proto.getServerType = function() {
  if (this.config.servertype && this.config.servertype != '') {
    return this.config.servertype;
  }
  else {
    return ServerTypes.QGIS;
  }
};

proto.getType = function() {
  return this.type;
};

proto.setType = function(type) {
  this.type = type;
};

proto.isSelected = function() {
  return this.state.selected;
};

proto.isDisabled = function() {
  return this.state.disabled;
};

proto.isVisible = function() {
  return this.state.visible;
};

proto.setVisible = function(bool) {
  this.state.visible = bool;
};
// verifica se il layer è interrogabile
proto.isQueryable = function() {
  var queryEnabled = false;
  var queryableForCababilities = !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.QUERYABLE));
  // se è interrogabile verifico che il suo stato sia visibile e non disabilitato
  if (queryableForCababilities) {
    // è interrogabile se visibile e non disabilitato (per scala) oppure se interrogabile comunque (forzato dalla proprietà infowhennotvisible)
    queryEnabled = (this.isVisible() && !this.isDisabled());
    if (!_.isUndefined(this.config.infowhennotvisible) && (this.config.infowhennotvisible === true)) {
      queryEnabled = true;
    }
  }
  return queryEnabled;
};

//verifica se il il Layer è filtrabile
proto.isFilterable = function() {
  return !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.FILTERABLE));
};

proto.isEditable = function() {
  return !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.EDITABLE));
};

proto.isBaseLayer = function() {
  return this.config.baselayer;
};

// funzione che permette di ricavare un tipo di url del layer passandofli il tio (esempio data, editing..etc..)
proto.getUrl = function(type) {
  return this.config.urls[type];
};

// funzione generica che ritorna il valore urls del config
proto.getUrls = function() {
  return this.config.urls;
};

proto.getQueryUrl = function() {
  return this.config.urls.query;
};

proto.setQueryUrl = function(queryUrl) {
  this.config.urls.query = queryUrl;
};

proto.getQueryLayerName = function() {
  var queryLayerName;
  if (this.config.infolayer && this.config.infolayer != '') {
    queryLayerName = this.config.infolayer;
  }
  else {
    queryLayerName = this.config.name;
  }
  return queryLayerName;
};

proto.getQueryLayerOrigName = function() {
  var queryLayerName;
  if (this.state.infolayer && this.config.infolayer != '') {
    queryLayerName = this.config.infolayer;
  }
  else {
    queryLayerName = this.config.origname;
  }
  return queryLayerName;
};

proto.getInfoFormat = function(ogcService) {
  if (this.config.infoformat && this.config.infoformat != '' && ogcService !='wfs') {
    return this.config.infoformat;
  }
  else {
    return 'application/vnd.ogc.gml';
  }
};

proto.setInfoFormat = function(infoFormat) {
  this.state.infoformat = infoFormat;
};

proto.getAttributes = function() {
  return this.fields;
};

proto.changeAttribute = function(attribute, type, options) {
  _.forEach(this.fields, function(field) {
    if (field.name == attribute) {
      field.type = type;
      field.options = options;
    }
  })
};

proto.getAttributeLabel = function(name) {
  var label;
  _.forEach(this.getAttributes(),function(field){
    if (field.name == name){
      label = field.label;
    }
  });
  return label;
};

proto.getProvider = function(type) {
  return this.providers[type];
};

proto.getProviders = function() {
  return this.providers;
};

proto.getLayersStore = function() {
  return this._layersstore;
};

proto.setLayersStore = function(layerstore) {
  this._layersstore = layerstore;
};

///PROPRIETÀ DEL LAYER

// Tipo di Layer
Layer.LayerTypes = {
  TABLE: "table",
  IMAGE: "image",
  VECTOR: "vector"
};

// Tipo di server che lo gestisce
Layer.ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing",
  Local: "Local"
};

// tipo di sorgente
Layer.SourceTypes = {
  POSTGIS: 'postgres',
  SPATIALITE: 'spatialite',
  CSV: 'delimitedtext',
  WMS: 'wms'
};

// Caratteristiche del layer
Layer.CAPABILITIES = {
  QUERYABLE: 1,
  FILTERABLE: 2,
  EDITABLE: 4
};

//Tipi di editing sul layer
Layer.EDITOPS = {
  INSERT: 1,
  UPDATE: 2,
  DELETE: 4
};


module.exports = Layer;
