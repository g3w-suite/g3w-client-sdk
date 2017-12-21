var utils = require('../utils');
var RasterLayers = {};

RasterLayers.TiledWMSLayer = function(layerObj,extraParams){
  var options = {
    layerObj: layerObj,
    extraParams: extraParams || {},
    tiled: true
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers.WMSLayer = function(layerObj,extraParams){
  var options = {
    layerObj: layerObj,
    extraParams: extraParams || {}
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers._WMSLayer = function(options) {
  var layerObj = options.layerObj;
  var extraParams = options.extraParams;
  var tiled = options.tiled || false;
  var projection = layerObj.projection ? layerObj.projection.getCode() : null;

  var params = {
    LAYERS: layerObj.layers || '',
    VERSION: '1.3.0',
    TRANSPARENT: true,
    SLD_VERSION: '1.1.0'
  };

  params = utils.merge(params,extraParams);

  var sourceOptions = {
    url: layerObj.url,
    params: params,
    ratio: 1
  };

  var imageOptions = {
    id: layerObj.id,
    name: layerObj.name,
    opacity: layerObj.opacity || 1.0,
    visible:layerObj.visible,
    maxResolution: layerObj.maxResolution
  };

  var imageClass;
  var source;
  if (tiled) {
    source = new ol.source.TileWMS(sourceOptions);
    imageClass = ol.layer.Tile;
  }
  else {
    source = new ol.source.ImageWMS(sourceOptions);
    imageClass = ol.layer.Image;
  }

  imageOptions.source = source;

  return new imageClass(imageOptions);
};

RasterLayers.XYZLayer = function(options){
  if (!options.url){
    return;
  }

  var sourceOptions = {
    url: options.url
  };

  if (options.projection){
    sourceOptions.projection = options.projection;
  }
  if (options.maxZoom) {
    sourceOptions.maxZoom = options.maxZoom;
  }
  if (options.minZoom) {
    sourceOptions.minZoom = options.minZoom;
  }

  return new ol.layer.Tile({
    source: new ol.source.XYZ(sourceOptions)
  });
};

/*RasterLayers.TiledWMSLayer = function(layerObj){
  var layer = new ol.layer.Tile({
    name: layerObj.name,
    opacity: 1.0,
    source: new ol.source.TileWMS({
      url: layerObj.url,
      params: {
        LAYERS: layerObj.layers || '',
        VERSION: '1.3.0',
        TRANSPARENT: true
      }
    }),
    visible: layerObj.visible
  });

  return layer;
};*/

module.exports = RasterLayers;

