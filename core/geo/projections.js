var Projection = require('core/geo/projection');

var STANDARD_PROJECTIONS = [3857,900913,4326];

var Projections = {
  get: function(crs,proj4,extent) {
    crs = Projections.normalizeCrs(crs);
    var cachedProjection = ol.proj.projections.get(crs);

    if (cachedProjection) {
      return cachedProjection;
    }

    var projection = new Projection({
      crs: crs,
      proj4: proj4,
      extent: extent
    });

    ol.proj.projections.add(crs,projection);

    return projection;
  },
  normalizeCrs: function(crs) {
    if (typeof crs == 'number') {
      return "EPSG:"+crs
    }
    crs = crs.replace(/[^\d\.\-]/g, "");
    if (crs != '') {
      return "EPSG:"+parseInt(crs);
    }
  }
};

module.exports = Projections;