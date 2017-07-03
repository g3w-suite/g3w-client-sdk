var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var ProviderFactory = require('core/layers/providers/providersfactory');

var ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing"
};

function Layer(config) {
  var self = this;
  config = config || {};
  // contiene la configurazione statica del layer
  this.config = _.extend({
    id: config.id || 'Layer' ,
    title: config.title  || null,
    name: config.name || null,
    origname: config.origname || null,
    capabilities: config.capabilities || null,
    editops: config.editops || null,
    infoformat: config.infoformat || null,
    infourl: config.infourl || null,
    servertype: config.servertype || null,
    source: config.source || null,
    geolayer: false
  },config);
  
  // contiene la parte dinamica del layer
  //this.state = config; // questo fa in modo che il catalog reagisca al mutamento
  // delle proprietà dinamiche (select, disable, visible)
  this.state = {
    id: config.id,
    title: config.name,
    visible: config.visible,
    selected: config.selected | false,
    disabled: config.disabled | false,
    editing: false,
    modified: false,
    hidden: config.hidden || false
  };

  // contiene l'editor associato al layer
  this.editor = null;
  // Query Provider server a poter effettuare chiamate di informazione sul layer
  // es. query, quey bbox etc...
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

  var serverType = this.config.servertype;
  var sourceType = this.config.source.type;

  this.providers = {
    query: ProviderFactory.build('query',serverType,sourceType,{
      layer: this
    }),
    filter: ProviderFactory.build('filter',serverType,sourceType,{
      layer: this
    }),
    data: ProviderFactory.build('data',serverType,sourceType,{
      layer: this
    })
  };

  base(this);
}

inherit(Layer, G3WObject);

var proto = Layer.prototype;

proto.getProject = function() {
  return this.config.project;
};

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
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

proto.isVisible = function() {
  return this.state.visible;
};

proto.getServerType = function() {
  if (this.config.servertype && this.config.servertype != '') {
    return this.config.servertype;
  }
  else {
    return ServerTypes.QGIS;
  }
};

proto.isQueryable = function() {
  var queryEnabled = false;
  var queryableForCababilities = (this.config.capabilities && (this.config.capabilities && Layer.CAPABILITIES.QUERY)) ? true : false;
  if (queryableForCababilities) {
    // è interrogabile se visibile e non disabilitato (per scala) oppure se interrogabile comunque (forzato dalla proprietà infowhennotvisible)
    queryEnabled = (this.state.visible && !this.state.disabled);
    if (!_.isUndefined(this.config.infowhennotvisible) && (this.config.infowhennotvisible === true)) {
      queryEnabled = true;
    }
  }
  return queryEnabled;
};

proto.query = function(options) {
  options = options || {};
  var self = this;
  var d = $.Deferred();
  var type = options.type;
  var provider = this.providers.query;
  if (options.filter) {
    provider = this.providers.filter;
  }
  if (provider) {
    provider.query(options)
      .done(function(features) {
        d.resolve(features);
      })
      .fail(function(err) {
        d.reject(err);
      });
  }
  else {
    d.reject('Il layer non è interrogabile tramite filtri');
  }
  return d.promise();
};

proto.getQueryUrl = function() {
  var infoUrl;
  if (this.config.infourl && this.config.infourl != '') {
    infoUrl = this.config.infourl;
  }
  else {
    infoUrl = this.config.wmsUrl;
  }
  return infoUrl;
};

proto.setQueryUrl = function(queryUrl) {
  this.config.inforurl = queryUrl;
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

proto.isFilterable = function() {
  return this.providers.filter != undefined;
};

proto.getProvider = function(type) {
  return this.providers[type];
};


// SOLO GeoLayer implementa i seguenti metodi

proto.getGeometryType = function() {};

proto.setProjection = function(crs,proj4) {};

proto.getProjection = function() {};

proto.getCrs = function() {};

proto.getProjectCrs = function() {};

proto.isWMS = function() {return false};

proto.isWFS = function() {return false};

proto.isExternalWMS = function() {};

proto.getWMSLayerName = function() {};

proto.getWFSLayerName = function() {};

proto.isCached = function() {return false};

proto.getCacheUrl = function(){};

proto.getWfsCapabilities = function() {};

Layer.ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing",
  File: "File"
};

Layer.CAPABILITIES = {
  QUERY: 1,
  EDIT: 2
};

Layer.EDITOPS = {
  INSERT: 1,
  UPDATE: 2,
  DELETE: 4
};


module.exports = Layer;
