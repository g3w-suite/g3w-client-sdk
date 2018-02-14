const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const PrinterProvider = require('./providers/printerprovider');

function PrintService() {
  base(this);
  this.print = function(options) {
    /* options:
     type: printer server
     url:request url
     params : useful parameters
    */
    options = options || {};
    const type = options.type || 'QGIS';
    const provider = new PrinterProvider(type);
    const url = provider.print(options);
    return $.get(url)
  };
}

inherit(PrintService, G3WObject);

module.exports = new PrintService;
