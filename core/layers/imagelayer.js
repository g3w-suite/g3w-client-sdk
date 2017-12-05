var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var Layer = require('core/layers/layer');
var VectorLayer = require('./vectorlayer');
var GeoLayerMixin = require('./geolayermixin');

function ImageLayer(config) {
  config = config || {};
  /*{
    id,
    title,
    name,
    origname,
    multilayerid,
    servertype,
    source,
    crs,
    projection,
    bbox,
    capabilities,
    cache_url,
    baselayer,
    geometrytype,
    editops,
    expanded,
    fields,
    wmsUrl,
    infoformat,
    infourl,
    maxscale,
    minscale,
    visible,
    scalebasedvisibility,
    wfscapabilities
  }*/
  base(this, config);
  this.config.baselayer = config.baselayer || false;
  this.type = Layer.LayerTypes.IMAGE;
  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  this.setup(config);
}

inherit(ImageLayer, Layer);

mixin(ImageLayer, GeoLayerMixin);

var proto = ImageLayer.prototype;

proto.getLayerForEditing = function() {
  if (this.isEditable()) {
    // vado a clonare la configurazione
    // affinchè non vado a toccare l'originale
    var config = _.cloneDeep(this.config);
    //ritorno l'istanza del vectorlayer
    return new VectorLayer(config);
  } else {
    return null
  }
};

proto.isBaseLayer = function() {
  return this.config.baselayer;
};

proto.isWMS = function() {
  return ImageLayer.WMSServerTypes.indexOf(this.config.servertype) > -1;
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
  if (this.config.source && this.config.source.type == 'wms' && this.config.source.url) {
    url = this.config.source.url
  } else {
    url = this.config.wmsUrl;
  }
  return url;
};

proto.getQueryUrl = function() {
  var url = base(this, 'getQueryUrl');
  if (this.getServerType() == 'QGIS' && this.config.source && this.config.source.type == 'wms' && this.config.source.external) {
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

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};

ImageLayer.WMSServerTypes = [
  Layer.ServerTypes.QGIS,
  Layer.ServerTypes.Mapserver,
  Layer.ServerTypes.Geoserver,
  Layer.ServerTypes.OGC
];

module.exports = ImageLayer;
