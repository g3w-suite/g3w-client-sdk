const Projection = require('./projection');

const Projections = {
  get: function(crs, proj4def, extent) {
    crs = Projections.normalizeCrs(crs);
    const _proj =  ol.proj.projections ? ol.proj.projections : ol.proj;
    const cachedProjection = _proj.get(crs);
    if (cachedProjection) return cachedProjection;
    const projection = new Projection({
      crs,
      proj4def,
      extent
    });
    _proj.add ? _proj.add(crs, projection) : _proj.addProjection(projection);
    return projection;
  },
  normalizeCrs: function(crs) {
    if (typeof crs === 'number') return "EPSG:"+crs
    crs = crs.replace(/[^\d\.\-]/g, "");
    if (crs !== '') return "EPSG:"+parseInt(crs);
  }
};

//starting base projections
Projections.get("EPSG:3003", "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs");
Projections.get("EPSG:3045", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
Projections.get("EPSG:6708", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
Projections.get("EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
Projections.get("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs");
Projections.get("EPSG:23033", "+proj=utm +zone=33 +ellps=intl +units=m +no_defs");
Projections.get("EPSG:3004", "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs");

module.exports = Projections;
