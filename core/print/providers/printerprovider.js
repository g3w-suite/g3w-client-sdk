const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
// providers

const PrinterQGISProvider = require('./qgis/printerQGISProvider');

const Providers = {
  'QGIS': PrinterQGISProvider
};

function PrinterProvider(options) {
  options = options || {};
  const serverType = options.serverType || 'QGIS';
  this._provider = Providers[serverType];
  this.print = function(options) {
    return this._provider.print(options);
  };
  base(this);
}

inherit(PrinterProvider, G3WObject);

module.exports =  PrinterProvider;

