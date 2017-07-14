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
  // editors
  this._editors = [];
  // history -- oggetto che contiene gli stati dei layers
  this._history = new History();
}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto.start = function() {
  var editorPromises = [];
  var d = $.Deferred();
  // nel caso di start chiamo il metodo start
  // di ogni editor il quale andrà a chiedere al provider del
  // layer associato di recuperare e salvare nel featuresstore
  // le features richieste
  _.forEach(this._editors, function(editor) {
      editorPromises.push(editor.start())
  });
  $.when.call(this, editorPromises)
    .then(function() {
      d.resolve(true);
      this._started = true;
    })
    .fail(function() {
      d.reject();
      this._started = false;
    });
  return d.promise();
};

proto.isStarted = function() {
  return this._started;
};

proto.addEditor = function(editor) {
  if (this._editors.indexOf(editor) == -1) {
    this._editors.push(editor);
  }
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
  // prelevo l'ultimo stato dei layers editati per poter
  // creare l'oggetoo post da passare al server
  this._history.getLastLayersState();
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
  this._started = false;
  console.log('stop..')
};

// funzione che fa il cera della history
proto._clearHistory = function() {
  this._history.clear();
};

module.exports = Session;