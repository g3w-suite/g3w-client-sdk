var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;

function Session(){
  base(this);

  this._started = false;
  this._layers = [];
}
inherit(Session, G3WObject);

var proto = Session.prototype;

proto.start = function(){
  this._started = true;
};

proto.isStarted = function() {
  return this._started;
};

proto.addLayer = function(layer){
  this._layers.push(layer);
};

proto.commit = function() {
  console.log("Committing...");
  return resolve();
};

module.exports = Session;