const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const PrinterProviderFactory = require('./providers/printerproviderfactory');

function PrintService(options = {}) {
  base(this);
  const type = options.type || 'QGIS';
  this.provider = PrinterProviderFactory.get(type);

  this.getPrintUrl = function(options) {
    return this.provider.getPrintUrl(options)
  };
  this.print = function(options) {
    this.url = null;
    /* options:
     url:request url
     params : useful parameters
    */
    options = options || {};
    this.url = this.provider.print(options);
    return new Promise((resolve, reject) => {
      $.get(this.url)
        .then(() => {
          resolve(this.url)
        })
        .fail((err) => {
          reject(err)
        })
    });
  };
}

inherit(PrintService, G3WObject);

module.exports = PrintService;
