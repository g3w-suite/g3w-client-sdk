var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var PrinterProvider = require('./providers/printerprovider');

function PrintService() {
  base(this);
  // funzione generica nel caso volessi lanciare il print
  // senza ottenere il printer
  this.print = function(options) {
    /* options è un oggetto che contiene:
     type: tipo di printer server
     url: url a cui effettuare la richiesta
     params : oggetto contenete i parametri necessari alla creazione della richiesta
              come ad esempio filter etc ..
    */
    var options = options || {};
    var type = options.type || 'QGIS';
    var provider = new PrinterProvider(type);
    var url = provider.print(options);
    return $.get(url)
  };
}

inherit(PrintService, G3WObject);

module.exports = new PrintService;
