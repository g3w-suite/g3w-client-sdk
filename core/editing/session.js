var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;

// classe Session
function Session() {
  base(this);

  this._started = false;
  this._layers = [];
  this._editors = [];
}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto.start = function() {
  this._started = true;
};

proto.isStarted = function() {
  return this._started;
};

proto.addLayer = function(layer){
  this._layers.push(layer);
};

proto.addEditor = function(editor) {
  this._editors.push(editor);
};

proto.save = function() {
  console.log("Saving .... ");
  return resolve()
};

proto.commit = function() {
  console.log("Committing...");
  return resolve();
};

//funzione di rollback
proto.rollback = function() {

};

//funzione di close
proto.close = function() {

};

module.exports = Session;