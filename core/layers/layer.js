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

function Layer(state) {
  /*this.state = {
   fields: options.fields,
   bbox: options.bbox,getI
   capabilities: options.capabilities,
   crs: options.crs,
   disabled: options.disabled,
   editops: options.editops,
   geometrytype: options.geometrytype,
   id: options.id,
   infoformat: options.infoformat,
   infourl: options.infourl,
   maxscale: options.maxscale,
   minscale: options.minscale,
   multilayer: options.multilayer,
   name: options.name,
   origname: options.origname,
   relations: options.relations,
   scalebasedvisibility: options.scalebasedvisibility,
   selected: options.selected,
   servertype: options.servertype,
   source: options.source,
   title: options.title,
   visible: options.visible,
   selected: options.selected | false,
   disabled: options.disabled | false
   }*/
  // lo stato è sincronizzato con quello del layerstree
  this.state = state;

  /*if (!this.state.selected) {
   this.state.selected = false;
   }
   if (!this.state.disabled) {
   this.state.disabled = false;
   }*/

  this._project = null;
}


var proto = Layer.prototype;

proto.getProject = function() {
  return this._project;
};

proto.setProject = function(project) {
  this._project = project
};

proto.getId = function() {
  return this.state.id;
};

proto.getName = function() {
  return this.state.name;
};

proto.getOrigName = function() {
  return this.state.origname;
};

proto.getGeometryType = function() {
  return this.state.geometrytype;
};

proto.getAttributes = function() {
  return this.state.fields;
};

proto.changeAttribute = function(attribute, type, options) {
  _.forEach(this.state.fields, function(field) {
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
  var queryableForCababilities = (this.state.capabilities && (this.state.capabilities && CAPABILITIES.QUERY)) ? true : false;
  if (queryableForCababilities) {
    // è interrogabile se visibile e non disabilitato (per scala) oppure se interrogabile comunque (forzato dalla proprietà infowhennotvisible)
    queryEnabled = (this.state.visible && !this.state.disabled);
    if (!_.isUndefined(this.state.infowhennotvisible) && (this.state.infowhennotvisible === true)) {
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
    queryLayerName = this.state.infolayer;
  }
  else {
    queryLayerName = this.state.name;
  }
  return queryLayerName;
};

proto.getQueryLayerOrigName = function() {
  var queryLayerName;
  if (this.state.infolayer && this.state.infolayer != '') {
    queryLayerName = this.state.infolayer;
  }
  else {
    queryLayerName = this.state.origname;
  }
  return queryLayerName;
};

proto.getServerType = function() {
  if (this.state.servertype && this.state.servertype != '') {
    return this.state.servertype;
  }
  else {
    return Layer.ServerTypes.QGIS;
  }
};

proto.getCrs = function() {
  return this.getProject().getCrs();
};

proto.isWMS = function() {
  return Layer.WMSServerTypes.indexOf(this.state.servertype) > -1;
};

proto.isExternalWMS = function() {
  return (this.state.source && this.state.source.url);
};

proto.getWMSLayerName = function() {
  // prendo come inizio 'attributo name come nome del layer wms
  var layerName = this.state.name;
  if (this.state.source && this.state.source.layers) {
    layerName = this.state.source.layers;
  }
  return layerName;
};

proto.getWFSLayerName = function() {
  // prendo come inizio 'attributo name come nome del layer wms
  var layerName = this.state.origname;
  if (this.state.source && this.state.source.layers) {
    layerName = this.state.source.layers;
  }
  return layerName;
};

proto.getQueryUrl = function() {
  var infoUrl;
  if (this.state.infourl && this.state.infourl != '') {
    infoUrl = this.state.infourl;
  }
  else {
    infoUrl = state.wmsUrl;
  }
  if (this.getServerType() != 'QGIS') {
    infoUrl+='SOURCE=wms';
  }
  return infoUrl;
};

proto.setQueryUrl = function(queryUrl) {
  this.state.inforurl = queryUrl;
};

proto.getInfoFormat = function(ogcService) {
  if (this.state.infoformat && this.state.infoformat != '' && ogcService !='wfs') {
    return this.state.infoformat;
  }
  else {
    return this.getProject().getInfoFormat();
  }
};

proto.setInfoFormat = function(infoFormat) {
  this.state.infoformat = infoFormat;
};

proto.getWfsCapabilities = function() {
  return this.state.wfscapabilities || this.state.capabilities == 1 ;
};

proto.getWmsUrl = function() {
  var url;
  if (this.state.source && this.state.source.type == 'wms' && this.state.source.url){
    url = this.state.source.url
  }
  else {
    url = this.state.wmsUrl;
  }
  return url;
};

proto.getLegendUrl = function() {
  var url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return this.getWmsUrl()+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=True&ITEMFONTSIZE=10&WIDTH=300&LAYER='+this.getWMSLayerName();
};

Layer.ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing"
};

Layer.WMSServerTypes = [Layer.ServerTypes.QGIS,Layer.ServerTypes.Mapserver,Layer.ServerTypes.Geoserver,Layer.ServerTypes.OGC];

module.exports = Layer;
