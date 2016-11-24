var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var QGISPrinter = require('./printers/qgisprinter');

var Printers  = {
  'QGIS': QGISPrintService
};

function PrintService() {
  this._printer = null;
  base(this);
  // funzione che ritorna il printer in base al tipo
  this.getPrinter = function(type) {
    var type = type;
    if (!this._printer) {
      if (!type) { type = 'QGIS'}
      this._printer = new Printers[type];
    }
    return this._printer;
  };
  // possibilità di settare un nuovo printer Object
  this.setPrinter = function(printer) {
    this._printer = printer;
  };
  // funzione generica nel caso volessi lanciare il print
  // senza ottenere il printer
  this.print = function(options) {
    /* options è un oggetto che contiene:
     type: tipo di printer server
     url: url a cui effettuare la richiesta
     params : oggetto contenete i parametri necessari alla creazione della richiesta
              come ad esempio filter etc ..
    */
    var printer = this.this.getPrinter();
    printer.print(options);
  };

}
inherit(PrintService, G3WObject);

module.exports = PrintService;
