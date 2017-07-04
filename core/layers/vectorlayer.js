var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var mixin = require('core/utils/utils').mixin;
var TableLayer = require('./tablelayer');
var GeoLayerMixin = require('./geolayermixin');

function VectorLayer(config) {
  config = config || {};
  /*{
   id,
   title,
   name,
   origname,
   multilayerid,
   servertype,
   source,
   crs,
   projection,
   bbox,
   capabilities,
   cache_url,
   baselayer,
   geometrytype,
   editops,
   expanded,
   fields,
   wmsUrl,
   infoformat,
   infourl,
   maxscale,
   minscale,
   visible,
   scalebasedvisibility,
   wfscapabilities
   }*/

  base(this,config);

  this.config.type = Layer.LayerTypes.VECTOR;

  // vado a modificare lo state aggiungendo il bbox e l'informazione geolayer
  _.extend(this.state, {
    geolayer: true,
    bbox: config.bbox || null
  });
}
inherit(VectorLayer, TableLayer);
mixin(VectorLayer, GeoLayerMixin);

var proto = VectorLayer.prototype;

module.exports = VectorLayer;