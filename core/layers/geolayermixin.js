const Projections = require('g3w-ol3/src/projection/projections');


function GeoLayerMixin(config) {}

const proto = GeoLayerMixin.prototype;

proto.setup = function(config) {
  if (!this.config) {
    console.log("GeoLayerMixin must be used from a valid (geo) Layer instance");
    return;
  }
  this.config.multilayerid = config.multilayer;

  // estendo lo stato del layer settando la proprietà
  // geolayer a true e aggiungendo le informazioni del bbox alla proprietà bbox
  _.extend(this.state, {
    geolayer: true,
    bbox: config.bbox || null,
    visible: config.visible,
    exclude_from_legend: config.exclude_from_legend
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
  } else if (config.attributions) {
    this.config.attributions = config.attributions;
  }
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

proto.getCacheUrl = function(){
  if (this.isCached()) {
    return this.config.cache_url;
  }
};

module.exports = GeoLayerMixin;
