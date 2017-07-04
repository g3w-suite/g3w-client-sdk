var Layer = require('./layer');
var TableLayer = require('./tablelayer');
var VectorLayer = require('./vectorlayer');
var ImageLayer = require('./imagelayer');


function LayerFactory() {
  this.build = function(config) {
    // ritorna l'sitanza del provider selezionato
    var layerClass = this.get(config);
    if (layerClass) {
      return new layerClass(config);
    }
    return null;
  };

  this.get = function(config) {
    var LayerClass;
    var serverType = config.servertype;
    if (serverType == 'QGIS') {
      LayerClass = ImageLayer;
      if (config.source && config.geometrytype) {
        if ([Layer.SourceTypes.POSTGIS,Layer.SourceTypes.SPATIALITE,Layer.SourceTypes.CSV].indexOf(config.source.type) > -1) {
          if (config.geometrytype && config.geometrytype == undefined) {
            LayerClass = TableLayer;
          }
        }
      }
    }
    else if (serverType == 'OGC') {
      if (config.source) {
        var type = config.source.type;
        switch (type) {
          case 'WMS':
            LayerClass = ImageLayer;
            break;
          case 'WFS':
            LayerClass = VectorLayer;
        }
      }
    }
    else if (serverType == 'Local') {
      LayerClass = VectorLayer;
    }

    return LayerClass;
  };
}

module.exports = new LayerFactory();