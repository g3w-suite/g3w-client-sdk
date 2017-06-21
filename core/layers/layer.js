var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Projections = require('core/geo/projections');
var ProviderFactory = require('core/layers/providers/providersfactory');
var FeaturesStore = require('core/layers/features/featuresstore');
var Feature = require('core/layers/features/feature');
var Editor = require('core/editing/editor');
var GeometryTypes = require('core/geometry/geometry').GeometryTypes;

var ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing"
};

var WMSServerTypes = [
  ServerTypes.QGIS,
  ServerTypes.Mapserver,
  ServerTypes.Geoserver,
  ServerTypes.OGC
];

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
    projection: null,
    project: config.project,
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
    wmsUrl: config.wmsUrl,
    cacheUrl: config.cache_url
  };

  if (config.projection) {
    this.config.projection = config.projection;
  }
  else if (config.crs) {
    if (config.project) {
      if (config.project.projection.getCode() != config.crs) {
        Projections.get(config.crs,config.proj4);
      }
      else {
        this.config.projection = config.project.projection;
      }
    }
  }

  // in base alla tipologia di configurazione del layer
  // viene deciso quale provider deve essere instanziato
  //TEMPORANEO
  if (this.config.servertype == 'QGIS') {
    // contiene il provider associato al layer
    this.provider = ProviderFactory.build('qgis', {
      layer: this,
      layerName: this.getQueryLayerName(),
      infoFormat: this.getInfoFormat()
    });
    // vado a creare il featuresStore che si prenderà cura del recupero
    // dati (attraverso il suo provider) e salvataggio features
    this._featuresStore = new FeaturesStore({
     dataprovider: this._provider //momentaneo
    });
  } else {
    // contiene il provider associato al layer
    this.provider = ProviderFactory.build('qgis', {
      layer: this,
      layerName: this.getQueryLayerName(),
      infoFormat: this.getInfoFormat()
    }); //
  }

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
  // relations
  this.relations = config.relations || null; // da vedere com gestirle
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
    // cancellazione di tutte le features del layer
    clearFeatures: function() {
      self._clearFeatures();
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

proto.getProject = function() {
  return this.config.getProject();
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
proto.readFeatures = function() {
  return this._featuresStore.readFeatures();
};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};


// funzione che recupera i dati da qualsisasi fonte (server, wms, etc..)
proto.getFeatures = function(options) {
  var self = this;
  var d = $.Deferred();
  this._featuresStore.getFeatures(options)
    .then(function(features) {
      return d.resolve(features);
    });
  return d.promise();
};

proto.query = function(options) {
  var self = this;
  var d = $.Deferred();
  this.provider.query(options)
    .then(function(features) {
      d.resolve(features);
    });
  return d.promise();
};

proto.isModified = function() {
  //medodo che stbilisce se modificato o no
  return this.state.modified;
};

proto.getDataProvider = function() {
  return this.dataprovider;
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

proto.isCached = function() {
  return this.config.cacheUrl && this.config.cacheUrl != '' ? true : false;
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

this.setProjection = function(crs,proj4) {
  this.config.projection = Projections.get(crs,proj4);
};

proto.getProjection = function() {
  return this.config.projection;
};

proto.getCrs = function() {
  if (this.config.projection) {
    return this.config.projection.getCode();
  }
};

proto.getProjectCrs = function() {
  if (this.config.project) {
    return this.config.project.getProjection().getCode();
  }
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

proto.getCacheUrl = function(){
  if (this.isCached()) {
    return this.config.cacheUrl;
  }
};

proto.getQueryUrl = function() {
  var infoUrl;
  if (this.config.infourl && this.config.infourl != '') {
    infoUrl = this.config.infourl;
  }
  else {
    infoUrl = this.config.wmsUrl;
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


module.exports = Layer;
