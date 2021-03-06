const Projection = require('./projection');

const STANDARD_PROJECTIONS = [3857,900913,4326];

const Projections = {
  get: function(crs, proj4, extent) {
    crs = Projections.normalizeCrs(crs);
    const _proj =  ol.proj.projections ? ol.proj.projections : ol.proj;
    const cachedProjection = _proj.get(crs);
    if (cachedProjection) {
      return cachedProjection;
    }
    const projection = new Projection({
      crs: crs,
      proj4def: proj4,
      extent: extent
    });
    _proj.add ? _proj.add(crs, projection) : _proj.addProjection(projection);
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
