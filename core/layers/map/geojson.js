const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const VectorLayer = require('./vectorlayer');
const Provider = require('../providers/geojsonprovider');

function GeojsonLayer(options) {
  const provider = new Provider(options);
  this.setProvider(provider);
  base(this, options);
}

inherit(GeojsonLayer, VectorLayer);


module.exports = GeojsonLayer;
