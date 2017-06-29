var GENERIC_GRID_EXTENT = [0,0,8388608,8388608];

var Projection = function(options) {
  if (!options.crs) {
    return null;
  }

  if (options.proj4def) {
    proj4.defs(options.crs,options.proj4def);
  }

  ol.proj.Projection.call(this, {
    code: options.crs,
    extent: options.extent ? options.extent : GENERIC_GRID_EXTENT
  });

  // riespongo axisOrientation_ perché in OL è prinvata
  this._axisOrientation = options.axisOrientation ? options.axisOrientation : 'enu';
  if (options.proj4def) {
    var proj4def = proj4.defs(options.crs);
    if ( proj4def.axis != undefined) {
      this._axisOrientation = proj4def.axis;
    }
  }

};

ol.inherits(Projection, ol.proj.Projection);

var proto = Projection.prototype;

proto.getAxisOrientation = function() {
  return this._axisOrientation;
};

module.exports = Projection;