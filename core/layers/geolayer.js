var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Layer = require('core/layers/layer');
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

function GeoLayer(config) {
  base(this, config);
  var self = this;
  _.extend(this.config,{
    bbox: config.bbox,
    projection: null,
    project: config.project,
    geometrytype: config.geometrytype,
    infoformat: config.infoformat,
    infourl: config.infourl,
    maxscale: config.maxscale,
    minscale: config.minscale,
    multilayerid: config.multilayer,
    scalebasedvisibility: config.scalebasedvisibility,
    wmsUrl: config.wmsUrl,
    cacheUrl: config.cache_url,
    baselayer: config.baselayer || false,
    wfscapabilities: config.wfscapabilities
  });

  // temporaneo
  this.state.geolayer = true;


  if (config.projection) {
    this.config.projection = config.projection;
  }
  else if (config.crs) {
    if (config.project) {
      if (config.project.getProjection().getCode() != config.crs) {
        Projections.get(config.crs,config.proj4);
      }
      else {
        this.config.projection = config.project.getProjection();
      }
    }
  }

  // in base alla tipologia di configurazione del layer
  // viene deciso quale provider deve essere instanziato
  //TEMPORANEO
  if (this.config.servertype == Layer.ServerTypes.QGIS) {
    // contiene il provider associato al layer
    this._queryprovider = ProviderFactory.build('qgis', {
      layer: this,
      layerName: this.getQueryLayerName(),
      infoFormat: this.getInfoFormat()
    });
    // vado a creare il featuresStore che si prenderà cura del recupero
    // dati (attraverso il suo provider) e salvataggio features
    this._featuresStore = new FeaturesStore({
      dataprovider: this._queryprovider //momentaneo
    });
  } else {
    // contiene il provider associato al layer
    this._queryprovider = ProviderFactory.build('qgis', {
      layer: this,
      layerName: this.getQueryLayerName(),
      infoFormat: this.getInfoFormat()
    }); //
  }
}

inherit(GeoLayer, Layer);

var proto = GeoLayer.prototype;

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
  console.log('start Editing');
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

proto.isModified = function() {
  //medodo che stbilisce se modificato o no
  return this.state.modified;
};

proto.getDataProvider = function() {
  return this._dataprovider;
};

proto.getMultiLayerId = function() {
  return this.config.multilayerid;
};

proto.getGeometryType = function() {
  return this.config.geometrytype;
};

proto.getMultiLayerId = function() {
  return this.config.multilayerid;
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

proto.isBaseLayer = function() {
  return this.config.baselayer;
};

proto.getServerType = function() {
  if (this.config.servertype && this.config.servertype != '') {
    return this.config.servertype;
  }
  else {
    return Layer.ServerTypes.QGIS;
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
  if (this.config.projection) {
    return this.config.projection.getCode();
  }
};

proto.isWMS = function() {
  return WMSServerTypes.indexOf(this.config.servertype) > -1;
};

proto.isWFS = function() {
  return this.config.wfscapabilities == 1;
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

proto.getWFSLayerName = function() {
  // prendo come inizio 'attributo name come nome del layer wms
  var layerName = this.config.origname;
  if (this.config.source && this.config.source.layers) {
    layerName = this.config.source.layers;
  }
  return layerName;
};

proto.isCached = function() {
  return this.config.cacheUrl && this.config.cacheUrl != '' ? true : false;
};

proto.getCacheUrl = function(){
  if (this.isCached()) {
    return this.config.cacheUrl;
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
  var self = this;
  var d = $.Deferred();
  this._queryprovider.query(options)
    .then(function(features) {
      d.resolve(features);
    });
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
  if (this.getServerType() != 'QGIS') {
    infoUrl+='SOURCE=wms';
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

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};

GeoLayer.WMSServerTypes = [
  ServerTypes.QGIS,
  ServerTypes.Mapserver,
  ServerTypes.Geoserver,
  ServerTypes.OGC
];


module.exports = GeoLayer;
