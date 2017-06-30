var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var LayersStoresRegistry = require('core/layers/layersstoresregistry');

function CatalogLayersStoresRegistry() {
  base(this);
}

inherit(CatalogLayersStoresRegistry, LayersStoresRegistry );

module.exports = new CatalogLayersStoresRegistry();