const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const Layer = require('./layer');

function GeojsonLayer(config) {
  base(this, config);
  this.type = Layer.LayerTypes.VECTOR;
  this.state.geolayer = true;
  this.config.style = config.style;
}

inherit(GeojsonLayer, Layer);


module.exports = GeojsonLayer;
