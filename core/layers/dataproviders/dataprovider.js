var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');


function DataProvider(options) {
  options = options || {};
  this._isReady = false;
  base(this);
}


var proto = DataProvider.prototype;

proto.getData = function() {
  console.log('da sovrascrivere')
};

proto.setReady = function(bool) {
  this._isReady = bool;
};

proto.isReady = function() {
  return this._isReady;
};


inherit(DataProvider, G3WObject);

module.exports =  DataProvider;