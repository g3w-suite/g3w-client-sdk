var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Layer = require('./layer');

function TableLayer(config) {
  base(this, config);

  this.config.type = Layer.LayerTypes.TABLE;
}
inherit(TableLayer, Layer);

var proto = TableLayer.prototype;

module.exports = TableLayer;