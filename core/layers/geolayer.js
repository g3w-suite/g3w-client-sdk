var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Layer = require('core/layers/layer');
var Projections = require('g3w-ol3/src/projection/projections');
var ProviderFactory = require('core/layers/providers/providersfactory');
var FeaturesStore = require('core/layers/features/featuresstore');
var Feature = require('core/layers/features/feature');
var Editor = require('core/editing/editor');
var GeometryTypes = require('core/geometry/geometry').GeometryTypes;

function GeoLayer(config) {
  config = config || {};
  base(this, {
    id: config.id || null,
    title: config.title || null,
    name: config.name || null,
    origname: config.origname || null,
    multilayerid: config.multilayer || null,
    servertype: config.servertype || null,
    source: config.source || null,
    crs: config.crs || null,
    projection: null,
    bbox: config.bbox || null,
    capabilities: config.capabilities || null,
    cacheUrl: config.cache_url || null,
    baselayer: config.baselayer || false,
    geometrytype: config.geometrytype || null,
    editops: config.editops || null,
    expanded: config.expanded || null,
    fields: config.fields || null,
    wmsUrl: config.wmsUrl || null,
    infoformat: config.infoformat || null,
    infourl: config.infourl || null,
    maxscale: config.maxscale || null,
    minscale: config.minscale || null,
    visible: config.visible || null,
    scalebasedvisibility: config.scalebasedvisibility || null,
    wfscapabilities: config.wfscapabilities || null
  });

  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  _.extend(this.state, {
    geolayer: true,
    bbox: config.bbox || null
  });

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
}

inherit(GeoLayer, Layer);

var proto = GeoLayer.prototype;

proto.getVectorLayer = function() {
  var vectorLayer = _.cloneDeep(this);
  vectorLayer.config.servertype = 'vector';
  // vado a creare il featuresStore che si prenderà cura del recupero
  // dati (attraverso il suo provider) e salvataggio features
  vectorLayer._featuresStore = new FeaturesStore({
    dataprovider: this._getDataProvider()
  });
  return vectorLayer;
};

proto._getDataProvider = function() {
  //funzione che mi serve a costruire il dataprovidere
  // da passare al featuresStore del layer vettoriale
  var dataProvider = ProviderFactory.build('qgis', {
    layer: this,
    layerName: this.getQueryLayerName(),
    infoFormat: this.getInfoFormat()
  });

  return dataProvider;
};


proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
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

proto.isBaseLayer = function() {
  return this.config.baselayer;
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

proto.isWMS = function() {
  return GeoLayer.WMSServerTypes.indexOf(this.config.servertype) > -1;
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

proto.getQueryUrl = function() {
  var url = base(this,'getQueryUrl');
  if (this.getServerType() != 'QGIS') {
    url+='SOURCE=wms';
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

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};

proto.getFeaturesStore = function() {
  return this._featuresStore;
};

GeoLayer.WMSServerTypes = [
  Layer.ServerTypes.QGIS,
  Layer.ServerTypes.Mapserver,
  Layer.ServerTypes.Geoserver,
  Layer.ServerTypes.OGC
];


module.exports = GeoLayer;
