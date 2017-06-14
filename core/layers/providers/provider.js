var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
// providers
var GeoJsonProvider = require('./geojsonprovider');
var G3WProvider = require('./g3wprovider');
var KmlProvider = require('./kmlprovider');
var XmlProvider = require('./xmlprovider');
var WmsProvider = require('./wmsprovider');
var WfsProvider = require('./wfsprovider');

var Providers = {
  geojson: GeoJsonProvider,
  kml: KmlProvider,
  xml: XmlProvider,
  g3w: G3WProvider,
  wms: WmsProvider,
  wfs: WfsProvider
};

// classe costruttore che permette a seconda delle caratteristiche dei layers
// ogcservice etc... di chiamare il proprio providers per effettuare le chiamte al server
function Provider(options) {
  options = options || {};
  var type = options.type || 'g3w';
  this._provider = Providers[type];
  this.getData = function(options) {
    return this._provider.getData(options);
  };
  base(this);
}

inherit(Provider, G3WObject);

module.exports =  Provider;