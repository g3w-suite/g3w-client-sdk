var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var ErrorParser = function() {
  base(this);
};

inherit(ErrorParser, G3WObject);

module.export = ErrorParser;