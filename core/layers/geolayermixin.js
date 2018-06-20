const Projections = require('g3w-ol3/src/projection/projections');
const resToScale = require('g3w-ol3/src/utils/utils').resToScale;
function GeoLayerMixin(config) {}

const proto = GeoLayerMixin.prototype;

proto.setup = function(config) {

  if (!this.config) {
    console.log("GeoLayerMixin must be used from a valid (geo) Layer instance");
    return;
  }
  this.config.multilayerid = config.multilayer;
  // state extend of layer setting geolayer property to true
  // and adding informations of bbox
  _.extend(this.state, {
    geolayer: true,
    external: config.external || false,
    bbox: config.bbox || null,
    visible: config.visible || false,
    hidden: config.hidden || false,
    scalebasedvisibility: config.scalebasedvisibility || false,
    minscale: config.minscale,
    maxscale: config.maxscale,
    exclude_from_legend: (typeof config.exclude_from_legend == 'boolean') ? config.exclude_from_legend : true
  });
  if (config.projection) {
    if (config.projection.getCode() == config.crs)
      this.config.projection = config.projection;
    else
      this.config.projection = Projections.get(config.crs,config.proj4);
  } else if (config.attributions) {
    this.config.attributions = config.attributions;
  }
};

proto.getStyle = function() {
  return this.config.style;
};

proto.setStyle = function(style) {
  this.config.style = style;
};

proto.isDisabled = function() {
  return this.state.disabled
};

proto.setDisabled = function(resolution) {
  if (this.state.scalebasedvisibility) {
    const mapScale = resToScale(resolution);
    this.state.disabled = !(this.state.minscale >= mapScale && this.state.maxscale <= mapScale);
  } else {
    this.state.disabled = false
  }
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

proto.setProjection = function(crs,proj4) {
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

proto.isCached = function() {
  return this.config.cache_url && this.config.cache_url != '';
};

proto.getCacheUrl = function() {
  if (this.isCached()) {
    return this.config.cache_url;
  }
};

// return if layer has inverted axis
proto.hasAxisInverted = function() {
  const projection = this.getProjection();
  const axisOrientation = projection.getAxisOrientation ? projection.getAxisOrientation() : "enu";
  return axisOrientation.substr(0, 2) == 'ne';
};

proto.getMapLayer = function() {
  console.log('overwrite by single layer')
};

proto.setMapProjection = function(mapProjection) {
  this._mapProjection = mapProjection;
};

proto.getMapProjection = function() {
  return this._mapProjection;
}

module.exports = GeoLayerMixin;
