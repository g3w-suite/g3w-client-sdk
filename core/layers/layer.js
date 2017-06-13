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
  this.provider = null;
  //contiene i dati del layer
  this.data = null;
  // contiene l'editor associato al layer
  this.editor = null;
  // contiene la parte dinamica del layer
  this.state = {
    visible: config.visible,
    selected: config.selected | false,
    disabled: config.disabled | false,
    relations: config.relations
  };
  // struttura campi del layer
  this.fields = config.fields;
  // le features
  this.features = null;
}

var proto = Layer.prototype;

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
};

proto.getData = function() {
  return this.data;
};

proto.setData = function(data) {
  this.data = data;
};

proto.getEditor = function() {
  return this.editor;
};

proto.setEditor = function(editor) {
  this.editor = editor;
};

proto.setProvider = function(provider) {
  this.provider = provider;
};

proto.getProvider = function() {
  return this.provider;
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
  if (this.state.infolayer && this.state.infolayer != '') {
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
  var LayersRegistry = require('./layersregistry');
  var project = LayersRegistry.getProject();
  return project.getCrs();
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
    var LayersRegistry = require('./layersregistry');
    var project = LayersRegistry.getProject();
    return project.getInfoFormat();
  }
};

proto.setInfoFormat = function(infoFormat) {
  this.state.infoformat = infoFormat;
};

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};

proto.getWmsUrl = function() {
  var url;
  if (this.config.source && this.config.source.type == 'wms' && this.config.source.url){
    url = this.config.source.url
  }
  else {
    url = this.config.wmsUrl;
  }
  return url;
};

proto.getLegendUrl = function() {
  var url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return url+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=True&ITEMFONTSIZE=10&WIDTH=300&LAYER='+this.getWMSLayerName();
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
