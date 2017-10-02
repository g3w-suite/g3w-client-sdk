var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var ErrorParser = require('./parser/errorparser');
var Error = function() {
  base(this);
  this.parser = new ErrorParser();
};

inherit(ErrorParser, G3WObject);

proto.getError = function(error) {
  return this.parser(error)
};

module.export = Error;