var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;

// classe Session
function Session() {
  base(this);

  //attributo che stabilisce se la sessione è partita
  this._started = false;
  // layers coinvolti nella sessione
  // esso contene il suo editor
  this._layers = [];
  // history -- oggetto che contiene gli stati dei layers
  this._history = {}
}

inherit(Session, G3WObject);

var proto = Session.prototype;

this._getUniqueHistoryId = function() {
  return Date.now();
};

proto.start = function() {
  this._started = true;
};

proto.isStarted = function() {
  return this._started;
};

//vado ad aggiungere il layer alla sessione di editing
proto.addLayer = function(layer) {
  this._layers.push(layer);
};

//vado a rimuove un layer dalla sessione.
// Può avvenire se per quella sessione dopo una prima fase
// di salvataggio dell'editing decido di toglierlo dall
proto.removeLayer = function() {

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
  console.log('Rollback.....')
};

//funzione di stop
proto.stop = function() {
  console.log('stop..')
};

// funzione che fa il cera della history
proto._clearHistory = function() {
  this._history = {};
};

module.exports = Session;