const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const mixin = require('core/utils/utils').mixin;
const Layer = require('core/layers/layer');
const VectorLayer = require('./vectorlayer');
const WMSLayer = require('./map/wmslayer');
const XYZLayer = require('./map/xyzlayer');
const GeoLayerMixin = require('./geolayermixin');

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
  this.setup(config);
}

inherit(ImageLayer, Layer);

mixin(ImageLayer, GeoLayerMixin);

const proto = ImageLayer.prototype;

proto.getLayerForEditing = function({force=false}={}) {
  if (this.isEditable() || force) {
    // clone configuration
    const config = _.cloneDeep(this.config);
    //return istance of vectorlayer
    const editingLayer = new VectorLayer(config);
    this.setEditingLayer(editingLayer);
    return editingLayer;
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
  let layerName = this.config.name;
  if (this.config.source && this.config.source.layers) {
    layerName = this.config.source.layers;
  }
  return layerName;
};

proto.getWmsUrl = function() {
  let url;
  if (this.config.source && this.config.source.type == 'wms' && this.config.source.url) {
    url = this.config.source.url
  } else {
    url = this.config.wmsUrl;
  }
  return url;
};

proto.getQueryUrl = function() {
  let url = base(this, 'getQueryUrl');
  if (this.getServerType() == 'QGIS' && this.config.source && this.config.source.type == 'wms' && this.config.source.external) {
    url+='SOURCE=wms';
  }
  return url;
};

proto.getLegendUrl = function() {
  let url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return url+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=True&ITEMFONTSIZE=10&WIDTH=300&LAYER='+this.getWMSLayerName();
};

proto.getWFSLayerName = function() {
  let layerName = this.config.origname;
  if (this.config.source && this.config.source.layers) {
    layerName = this.config.source.layers;
  }
  return layerName;
};

proto.getWfsCapabilities = function() {
  return this.config.wfscapabilities || this.config.capabilities == 1 ;
};

proto.getMapLayer = function(options = {}, extraParams) {
  let mapLayer;
  if (this.isCached()) {
    mapLayer = new XYZLayer(options);
  } else {
    options.url = options.url || this.getWmsUrl();
    mapLayer = new WMSLayer(options, extraParams);
  }
  return mapLayer;
};

ImageLayer.WMSServerTypes = [
  Layer.ServerTypes.QGIS,
  Layer.ServerTypes.Mapserver,
  Layer.ServerTypes.Geoserver,
  Layer.ServerTypes.OGC
];

module.exports = ImageLayer;
