const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function PrinterProvider() {
  this.getPrintUrl = function(options) {
    console.log('overwrite')
  };
  this.print = function(options) {
    console.log('overwrite')
  };
  base(this);
}

inherit(PrinterProvider, G3WObject);

module.exports =  PrinterProvider;

