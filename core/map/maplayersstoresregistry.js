var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var layersstoresregistry = require('core/layers/layersstoresregistry');

function MapLayersStoresRegistry() {
  base(this);
}

module.exports = new MapLayersStoresRegistry();