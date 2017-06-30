var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var LayersStoresRegistry = require('core/layers/layersstoresregistry');

function MapLayersStoresRegistry() {
  base(this);
}

inherit(MapLayersStoresRegistry, LayersStoresRegistry);

module.exports = new MapLayersStoresRegistry();