var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
// providers
var GEOJSONDataProvider = require('./geojsondataprovider');
var G3WDataProvider = require('./g3wdataprovider');
var KMLDataProvider = require('./kmldataprovider');
var XMLDataProvider = require('./xmldataprovider');
var WMSDataProvider = require('./wmsdataprovider');
var WFSDataProvider = require('./wfsdataprovider');

var Providers = {
  geojson: GEOJSONDataProvider,
  kml: KMLDataProvider,
  xml: XMLDataProvider,
  g3w: G3WDataProvider,
  wms: WMSDataProvider,
  wfs: WFSDataProvider
};

// classe costruttore che permette a seconda delle caratteristiche dei layers
// ogcservice etc... di chiamare il proprio providers per effettuare le chiamte al server
function Provider(options) {
  options = options || {};
  var type = options.type || 'g3w';
  this._provider = Providers[type];
  this.getData = function(options) {
    return this._provider.getData(options); // il getData del provider ritorna sempre una promessa
  };
  base(this);
}

inherit(Provider, G3WObject);

module.exports =  Provider;