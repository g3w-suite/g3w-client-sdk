const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const BaseLayer = require('core/layers/baselayers/baselayer');
const BasesLayers = require('g3w-ol3/src/layers/bases');

function TMSLayer(options={}){
  base(this,options);
}

inherit(TMSLayer, BaseLayer);

const proto = TMSLayer.prototype;

proto._makeOlLayer = function() {
  // here configuration to create TMS
  const olLayer = BasesLayers.TMS.get({});
  return olLayer
};


module.exports = TMSLayer;
