var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
// providers

var PrinterQGISProvider = require('./qgis/printerQGISProvider');

var Providers = {
  'QGIS': PrinterQGISProvider
};

// classe costruttore che permette a seconda delle caratteristiche dei layers
// ogcservice etc... di chiamare il proprio providers per effettuare le chiamte al server
function PrinterProvider(options) {
  var options = options || {};
  var serverType = options.serverType || 'QGIS';
  this._provider = Providers[serverType];
  this.print = function(options) {
    console.log(options);
    return this._provider.print(options);
  };
  base(this);
}

inherit(PrinterProvider, G3WObject);

module.exports =  PrinterProvider;

