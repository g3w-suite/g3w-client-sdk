const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const BaseLayer = require('core/layers/baselayers/baselayer');
const BasesLayers = require('g3w-ol3/src/layers/bases');

function ARCGISMAPSERVERLayer(options={}) {
  this.config = options;
  base(this, options);
}

inherit(ARCGISMAPSERVERLayer, BaseLayer);

const proto = ARCGISMAPSERVERLayer.prototype;

proto._makeOlLayer = function() {
  // here configuration to create TMS
  const {url, attributions, crs=3857} = this.config;
  const olLayer = BasesLayers.TMS.get({
    url,
    source_type: 'arcgismapserver',
    projection: `EPSG:${crs}`,
    attributions
  });
  return olLayer
};


module.exports = ARCGISMAPSERVERLayer;
