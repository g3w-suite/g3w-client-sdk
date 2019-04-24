const RasterLayers = {};

RasterLayers.TiledWMSLayer = function(layerObj,extraParams){
  const options = {
    layerObj: layerObj,
    extraParams: extraParams || {},
    tiled: true
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers.WMSLayer = function(layerObj,extraParams, method='GET'){
  const options = {
    layerObj: layerObj,
    extraParams: extraParams || {},
    method
  };
  return RasterLayers._WMSLayer(options);
};

RasterLayers._WMSLayer = function(options={}) {
  const layerObj = options.layerObj;
  const method = options.method || 'GET';
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
    params,
    ratio: 1,
    projection
  };
  if (method === 'POST') {
    window.URL = window.URL || window.webkitURL;
    sourceOptions.imageLoadFunction = function(image, url) {
      const xhr = new XMLHttpRequest();
      const [_url, params] = url.split('?');
      xhr.open('POST', _url);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      xhr.responseType = 'blob';
      xhr.onload = function() {
        const data = this.response;
        if (data !== undefined) {
          image.getImage().src = window.URL.createObjectURL(data);
        } else {
          image.setState(ol.TileState.ERROR);
        }
      };
      xhr.onerror = function() {
        image.setState(ol.TileState.ERROR);
      };
      xhr.send(params);
    };
  }

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
  } else {
    source = new ol.source.ImageWMS(sourceOptions);
    imageClass = ol.layer.Image;
  }

  imageOptions.source = source;

  return new imageClass(imageOptions);
};

RasterLayers.XYZLayer = function(options={}, method='GET') {
  if (!options.url){
    return;
  }

  const sourceOptions = {
    url: options.url
  };
  if (options.projection) {
    sourceOptions.projection = options.projection;
  }
  if (options.maxZoom) {
    sourceOptions.maxZoom = options.maxZoom;
  }
  if (options.minZoom) {
    sourceOptions.minZoom = options.minZoom;
  }
  // if (method === 'POST') {
  //   window.URL = window.URL || window.webkitURL;
  //   sourceOptions.tileLoadFunction = function(imageTile, url) {
  //     const xhr = new XMLHttpRequest();
  //     xhr.open('POST', url);
  //     xhr.setRequestHeader('Content-Type', 'image/png');
  //     xhr.responseType = 'blob';
  //     xhr.onload = function() {
  //       const data = this.response;
  //       if (data !== undefined) {
  //         imageTile.getImage().src = window.URL.createObjectURL(data);
  //       } else {
  //         imageTile.setState(ol.TileState.ERROR);
  //       }
  //     };
  //     xhr.onerror = function() {
  //       imageTile.setState(ol.TileState.ERROR);
  //     };
  //     xhr.send();
  //   };
  // }
  return new ol.layer.Tile({
    source: new ol.source.XYZ(sourceOptions)
  });
};

module.exports = RasterLayers;

