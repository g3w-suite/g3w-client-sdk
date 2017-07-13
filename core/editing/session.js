var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var History = require('./history');

// classe Session
function Session() {
  base(this);

  //attributo che stabilisce se la sessione è partita
  this._started = false;
  // history -- oggetto che contiene gli stati dei layers
  this._history = new History();
}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto.start = function() {
  this._started = true;
};

proto.isStarted = function() {
  return this._started;
};

//vado ad aggiungere il layer alla sessione di editing
proto.addLayer = function(layer) {
  this._history.addLayer(layer);
};

//vado a rimuove un layer dalla sessione.
// Può avvenire se per quella sessione dopo una prima fase
// di salvataggio dell'editing decido di toglierlo dall
proto.removeLayer = function() {
  this._history.removeLayer(layer);
};

proto.save = function() {
  console.log("Saving .... ");
  // andarà a popolare la history
  return resolve()
};

proto.commit = function() {
  console.log("Committing...");
  // andà a pesacare dalla history tutte le modifiche effettuare
  // e si occuperà di di eseguire la richiesta al server di salvataggio dei dati
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
  this._history.clear();
};

module.exports = Session;