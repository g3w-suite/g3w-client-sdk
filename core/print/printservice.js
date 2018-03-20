const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const PrinterProvider = require('./providers/printerprovider');

function PrintService() {
  base(this);
  this.url = null;
  this.print = function(options) {
    this.url = null;
    /* options:
     type: printer server
     url:request url
     params : useful parameters
    */
    options = options || {};
    const type = options.type || 'QGIS';
    const provider = new PrinterProvider(type);
    this.url = provider.print(options);
    return $.get(this.url)
  };
}

inherit(PrintService, G3WObject);

module.exports = new PrintService;
