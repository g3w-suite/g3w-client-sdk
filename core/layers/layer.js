var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Editor = require('core/editing/editor');
// providers
var GEOJSONDataProvider = require('./dataproviders/geojsondataprovider');
var G3WDataProvider = require('./dataproviders/g3wdataprovider');
var KMLDataProvider = require('./dataproviders/kmldataprovider');
var XMLDataProvider = require('./dataproviders/xmldataprovider');
var WMSDataProvider = require('./dataproviders/wmsdataprovider');
var WFSDataProvider = require('./dataproviders/wfsdataprovider');

var Providers = {
  geojson: GEOJSONDataProvider,
  kml: KMLDataProvider,
  xml: XMLDataProvider,
  g3w: G3WDataProvider,
  wms: WMSDataProvider,
  wfs: WFSDataProvider
};

var GeometryTypes = require('core/geometry/geometry').GeometryTypes;

var CAPABILITIES = {
  QUERY: 1,
  EDIT: 2
};

var EDITOPS = {
  INSERT: 1,
  UPDATE: 2,
  DELETE: 4
};

function Layer(config) {
  var self = this;
  // contiene la configurazione statica del layer
  this.config = {
    bbox: config.bbox,
    capabilities: config.capabilities,
    crs: config.crs,
    editops: config.editops,
    geometrytype: config.geometrytype,
    id: config.id,
    infoformat: config.infoformat,
    infourl: config.infourl,
    maxscale: config.maxscale,
    minscale: config.minscale,
    multilayer: config.multilayer,
    name: config.name,
    origname: config.origname,
    scalebasedvisibility: config.scalebasedvisibility,
    servertype: config.servertype,
    source: config.source,
    title: config.title,
    wmsUrl: config.wmsUrl
  };
  // contiene il provider associato al layer
  this.providers = {}; // o this.providers ???? nel caso di un layer wms che vector?
  //contiene i dati del layer che siano vettoriali, tabellari o ogc
  // sono forniti dal provider
  this.data = null;
  // contiene l'editor associato al layer
  this.editor = null;
  // contiene la parte dinamica del layer
  //this.state = config; // questo fa in modo che il catalog reagisca al mutamento
  // delle proprietà dinamiche (select, disable, visible)
  this.state = {
    visible: config.visible,
    selected: config.selected | false,
    disabled: config.disabled | false,
    editing: false,
    currentProvider: null,
    modified: false
  };
  // struttura campi del layer
  this.fields = config.fields;
  // le features
  this.features = null;
  // relations
  this.relations = config.relations || null;
  // setters
  this.setters = {
    //funzione che segnala lo start editing
    startEditing: function() {
      self._startEditing();
    },
    // segnalazione stop editing
    stopEditing: function() {
      self._stopEditing();
    },
    setData: function(data) {
      // fa in modo che chi interressa saper quando ci sono dat  nuovi
      // le legga e ne faccia ciò che vuole
      self._setData(data);
    },
    // cancellazione di tutti i dati del layer
    clearData: function() {
      self._clearData();
    }
  };
  base(this);
}

inherit(Layer, G3WObject);

var proto = Layer.prototype;

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
};

proto._setData = function(data) {
  this.data = data;
};

proto.getEditor = function() {
  return this.editor;
};

proto.setEditor = function(editor) {
  this.editor = editor;
};

proto._startEditing = function() {
  console.log('start Editing')
  //this.editor.start();
};

proto._stopEditing = function() {
  console.log('stop editing');
  // this.editor.stop()
};

// funzione per la lettura dei dati precedentemente acquisiti dal provider
proto.readData = function() {
  return this.data;
};

// scrive i dati nella feature dopo ad esempio un commit etc / caso wms non serve non ha senso
proto.writeData = function(data) {
  this.data = data;
};

proto._clearData = function() {
  this.data = null;
};

// funzione che recupera i dati da qualsisasi fonte (server, wms, etc..)
proto.getData = function(options) {
  options = options || {};
  var providerName = options.providerName;
  var provider = new Providers[providerName];
  provider.getData(options);
  // a seconda delle opzioni cheido al provieder di fornirmi i dati
  /* var provider = this.getCurrentProvider();
  var data = this.getCuprovider.getData(options);
  this.setData(data);
   */
  console.log('getData', options);
};

proto.isModified = function() {
  //medodo che stbilisce se modificato o no
  return this.state.modified;
};

proto.getProviders = function() {
  return this.providers;
};

proto.addProvider = function(provider) {
  this.providers.push(provider);
};

proto.getProvider = function(type) {
  return this.providers[type];
};

proto.setCurrentProvider = function(provider) {
  this.state.currentProvider = provider;
};

proto.getCurrentProvider = function() {
  return this.state.currentProvider;
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

proto.getGeometryType = function() {
  return this.config.geometrytype;
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

// restituisce tutte le relazioni legati a quel layer
proto.getRelations = function() {
  return this.state.relations
};

//restituisce gli attributi fields di una deterninata relazione
proto.getRelationAttributes = function(relationName) {
  var fields = [];
  _.forEach(this.state.relations, function(relation) {
    if (relation.name == relationName) {
      fields = relation.fields;
      return false
    }
  });
  return fields;
};

// retituisce un oggetto contenente nome relazione e fileds(attributi) associati
proto.getRelationsAttributes = function() {
  var fields = {};
  _.forEach(this.state.relations, function(relation) {
    fields[relation.name] = relation.fields;
  });
  return fields;
};

proto.isSelected = function() {
  return this.state.selected;
};

proto.isDisabled = function() {
  return this.state.disabled;
};

proto.isQueryable = function() {
  var queryEnabled = false;
  var queryableForCababilities = (this.config.capabilities && (this.config.capabilities && CAPABILITIES.QUERY)) ? true : false;
  if (queryableForCababilities) {
    // è interrogabile se visibile e non disabilitato (per scala) oppure se interrogabile comunque (forzato dalla proprietà infowhennotvisible)
    queryEnabled = (this.state.visible && !this.state.disabled);
    if (!_.isUndefined(this.config.infowhennotvisible) && (this.config.infowhennotvisible === true)) {
      queryEnabled = true;
    }
  }
  return queryEnabled;
};

proto.isVisible = function() {
  return this.state.visible;
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

proto.getServerType = function() {
  if (this.state.servertype && this.config.servertype != '') {
    return this.config.servertype;
  }
  else {
    return ServerTypes.QGIS;
  }
};

proto.getCrs = function() {
  return 3003;
};

proto.isWMS = function() {
  return WMSServerTypes.indexOf(this.config.servertype) > -1;
};

proto.isExternalWMS = function() {
  return (this.config.source && this.config.source.url);
};

proto.getWMSLayerName = function() {
  // prendo come inizio 'attributo name come nome del layer wms
  var layerName = this.config.name;
  if (this.config.source && this.config.source.layers) {
    layerName = this.config.source.layers;
  }
  return layerName;
};

proto.getWFSLayerName = function() {
  // prendo come inizio 'attributo name come nome del layer wms
  var layerName = this.config.origname;
  if (this.config.source && this.config.source.layers) {
    layerName = this.config.source.layers;
  }
  return layerName;
};

proto.getQueryUrl = function() {
  var infoUrl;
  if (this.config.infourl && this.config.infourl != '') {
    infoUrl = this.config.infourl;
  }
  else {
    var LayersRegistry = require('./layersregistry');
    infoUrl = LayersRegistry.getConfig().WMSUrl;
  }
  if (this.getServerType() != 'QGIS') {
    infoUrl+='SOURCE=wms';
  }
  return infoUrl;
};

proto.setQueryUrl = function(queryUrl) {
  this.config.inforurl = queryUrl;
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

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};


ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing"
};

WMSServerTypes = [
  ServerTypes.QGIS,
  ServerTypes.Mapserver,
  ServerTypes.Geoserver,
  ServerTypes.OGC
];

module.exports = Layer;
