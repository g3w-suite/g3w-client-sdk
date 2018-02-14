const Layer = require('./layer');
const TableLayer = require('./tablelayer');
const VectorLayer = require('./vectorlayer');
const ImageLayer = require('./imagelayer');
const BaseLayers = require('./baselayers/baselayers');

// Class to build layer based on configuration
function LayerFactory() {
  this.build = function(config, options) {
    // return the layer instance
    const layerClass = this.get(config);
    if (layerClass) {
      return new layerClass(config, options);
    }
    return null;
  };

  this.get = function(config) {
    let LayerClass;
    const serverType = config.servertype;
    if(serverType == 'QGIS') {
      LayerClass = ImageLayer;
      if(config.source && config.geometrytype) {
        if([Layer.SourceTypes.POSTGIS, Layer.SourceTypes.SPATIALITE, Layer.SourceTypes.CSV].indexOf(config.source.type) > -1) {
          if(config.geometrytype && config.geometrytype == 'No geometry') {
            // if no geometry retun Table Layer
            LayerClass = TableLayer;
          }
        }
      }
    } else if(serverType == 'OGC') {
      if(config.source) {
        const type = config.source.type;
        switch (type) {
          case 'wms':
            LayerClass = ImageLayer;
            break;
          case 'wfs':
            LayerClass = VectorLayer;
        }
      }
    } else if(serverType == 'Local') {
      LayerClass = VectorLayer;
    } else if(serverType == 'OSM' || serverType == 'Bing') {
      LayerClass = BaseLayers[serverType]
    }
    return LayerClass;
  }
}

module.exports = new LayerFactory();
