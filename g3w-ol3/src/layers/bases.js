const Projections = require('../projection/projections');
const BaseLayers = {};

BaseLayers.OSM = new ol.layer.Tile({
  source: new ol.source.OSM(),
  id: 'osm',
  title: 'OSM',
  basemap: true
});

BaseLayers.BING = {};

BaseLayers.BING.Road = new ol.layer.Tile({
  name:'Road',
  visible: false,
  preload: Infinity,
  source: new ol.source.BingMaps({
    key: 'Am_mASnUA-jtW3O3MxIYmOOPLOvL39dwMvRnyoHxfKf_EPNYgfWM9imqGETWKGVn',
    imagerySet: 'Road'
      // use maxZoom 19 to see stretched tiles instead of the BingMaps
      // "no photos at this zoom level" tiles
      // maxZoom: 19
  }),
  basemap: true
});

BaseLayers.TMS =  {
  get: function({visible=false, url=null, minZoom, maxZoom, attributions}={}) {
    return new ol.layer.Tile({
      visible,
      source: new ol.source.XYZ({
        url,
        minZoom,
        maxZoom,
        attributions
      }),
      basemap: true
    })
  }
};


BaseLayers.WMTS = {
  get: function({url, layer, visible, attributions, crs, format='image/png', opacity=0.7} = {}) {
    const projection = Projections.get(`EPSG:${crs}`);
    const projectionExtent = projection.getExtent();
    const size = ol.extent.getWidth(projectionExtent) / 256;
    const matrixIds = [];
    const resolutions = [];
    for (var i = 0; i < 18; i++) {
      matrixIds[i] = i.toString();
      resolutions[i] = size / Math.pow(2, i);
    }
    return new ol.layer.Tile({
      opacity,
      source: new ol.source.WMTS({
        attributions,
        url,
        layer,
        format,
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        })
      })
    })
  }
};

BaseLayers.BING.AerialWithLabels = new ol.layer.Tile({
  name: 'AerialWithLabels',
  visible: true,
  preload: Infinity,
  source: new ol.source.BingMaps({
    key: 'Am_mASnUA-jtW3O3MxIYmOOPLOvL39dwMvRnyoHxfKf_EPNYgfWM9imqGETWKGVn',
    imagerySet: 'AerialWithLabels'
      // use maxZoom 19 to see stretched tiles instead of the BingMaps
      // "no photos at this zoom level" tiles
      // maxZoom: 19
  }),
  basemap: true
});

BaseLayers.BING.Aerial = new ol.layer.Tile({
  name: 'Aerial',
  visible: false,
  preload: Infinity,
  source: new ol.source.BingMaps({
    key: 'Am_mASnUA-jtW3O3MxIYmOOPLOvL39dwMvRnyoHxfKf_EPNYgfWM9imqGETWKGVn',
    imagerySet: 'Aerial'
      // use maxZoom 19 to see stretched tiles instead of the BingMaps
      // "no photos at this zoom level" tiles
      // maxZoom: 19
  }),
  basemap: true
});

module.exports = BaseLayers;
