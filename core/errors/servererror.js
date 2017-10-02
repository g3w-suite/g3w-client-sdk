var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Error = require('./error');
var ServerErrorParser = require('./parser/servererrorparser');
var ServerError = function() {
  base(this);
  this.parser = new ServerErrorParser();
};

inherit(ServerError, Error);

module.exports = ServerError;

