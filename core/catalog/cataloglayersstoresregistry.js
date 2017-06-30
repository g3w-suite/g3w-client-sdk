var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var layersstoresregistry = require('core/layers/layersstoresregistry');

function CatalogLayersStoresRegistry() {
  base(this);
}

module.exports = new CatalogLayersStoresRegistry();