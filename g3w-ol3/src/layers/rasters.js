const RasterLayers = {};

RasterLayers.TiledWMSLayer = function(layerObj,extraParams){
  const options = {
    layerObj: layerObj,
    extraParams: extraParams || {},
    tiled: true
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers.WMSLayer = function(layerObj,extraParams){
  const options = {
    layerObj: layerObj,
    extraParams: extraParams || {}
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers._WMSLayer = function(options) {
  const layerObj = options.layerObj;
  const extraParams = options.extraParams;
  const tiled = options.tiled || false;
  const projection = layerObj.projection ? layerObj.projection.getCode() : null;

  let params = {
    LAYERS: layerObj.layers || '',
    VERSION: '1.3.0',
    TRANSPARENT: true,
    SLD_VERSION: '1.1.0',
  };

  params = Object.assign({},params,extraParams);

  const sourceOptions = {
    url: layerObj.url,
    params: params,
    ratio: 1,
    ptojection: projection
  };

  const imageOptions = {
    id: layerObj.id,
    name: layerObj.name,
    opacity: layerObj.opacity || 1.0,
    visible:layerObj.visible,
    maxResolution: layerObj.maxResolution
  };

  let imageClass;
  let source;
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

  const sourceOptions = {
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

module.exports = RasterLayers;

