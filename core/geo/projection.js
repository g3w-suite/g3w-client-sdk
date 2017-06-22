var GENERIC_GRID_EXTENT = [0,0,8388608,8388608];

var Projection = function(options) {
  if (!options.crs) {
    return null;
  }

  if (options.proj4def) {
    proj4.defs(epsgcode,options.proj4);
  }

  ol.proj.Projection.call(this, {
    code: options.crs,
    extent: options.extent ? options.extent : GENERIC_GRID_EXTENT
  });
};


ol.inherits(Projection, ol.proj.Projection);

proto = Projection.prototype;

proto.getEpsg = function() {
  return this.getCode().split('EPSG:')[1];
};

module.exports = Projection;