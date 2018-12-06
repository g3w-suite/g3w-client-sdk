const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const BaseLayer = require('core/layers/baselayers/baselayer');
const BasesLayers = require('g3w-ol3/src/layers/bases');

function WMTSLayer(options={}){
  base(this,options);
}

inherit(WMTSLayer, BaseLayer);

const proto = WMTSLayer.prototype;

proto._makeOlLayer = function() {
  //use this config to get params
  const olLayer = BasesLayers.WMTS.get({});
  return olLayer
};


module.exports = WMTSLayer;
