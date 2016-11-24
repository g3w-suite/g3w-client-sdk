var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var PrinterService = require('./printservice');

function QGISPrintService() {
  base(this);

}

inherit(QGISPrintService, PrinterService);

module.exports = QGISPrintService;