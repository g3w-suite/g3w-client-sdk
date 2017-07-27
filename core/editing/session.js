var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var History = require('./history');
var FeaturesStore = require('core/layers/features/featuresstore');
var UndoRedoManager = require('./undoredomanager');

// classe Session
function Session(options) {
  options = options || {};
  base(this);
  //attributo che stabilisce se la sessione è partita
  this.state = {
    started: false
  };
  // editor
  this._editor = options.editor || null;
  // featuresstore che contiene tutte le modifiche che vengono eseguite al layer
  // è la versione temporanea del features store de singolo editor
  this._featuresstore = new FeaturesStore();
  // history -- oggetto che contiene gli stati dei layers
  this._history = new History();
  // contenitore temporaneo che servirà a salvare tutte le modifiche
  // temporanee che andranno poi salvate nella history e nel featuresstore
  this._temporarychanges = [];
}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto.start = function(options) {
  var self = this;
  var d = $.Deferred();
  this._editor.start(options)
    .then(function(features) {
      // vado a popolare il featuresstore della sessione con le features
      //che vengono caricate via via dall'editor
      self._featuresstore.addFeatures(features);
      self.state.started = true;
      d.resolve(features);
    })
    .fail(function(err) {
      self.state.started = true;
      d.reject(err);
    });
  return d.promise();
};

proto.isStarted = function() {
  return this._started;
};

proto.getEditor = function() {
  return this._editor;
};

proto.setEditor = function(editor) {
  this._editor = editor;
};

// questa funzione sarà adibita al salvataggio (temporaneo) delle modifiche
// al layer sia nella history che nel featuresstore
proto.save = function() {
  var self = this;
  var d = $.Deferred();
  var uniqueId = Date.now();
  // vado a d aggiungere tutte le modifiche temporanee
  this._history.add(uniqueId, this._temporarychanges)
    .then(function() {
      self._temporarychanges = [];
      d.resolve();
    });
  //vado a pololare la history
  console.log("Session Saving .... ");
  // andarà a popolare la history
  return d.promise();
};

// metodo che server ad aggiungere features temporanee che poi andranno salvate
// tramite il metodo save della sessione
proto.push = function(feature) {
  this._temporarychanges.push(feature);
};

// funzione di rollback
// questa in pratica restituirà tutte le modifche che non saranno salvate nella history
// e nel featuresstore della sessione ma riapplicate al contrario
proto.rollback = function() {
  var d = $.Deferred();
  //vado a afre il rollback del feature store
  UndoRedoManager.execute(this._featuresstore, this._temporarychanges);
  console.log('Session Rollback.....');
  return d.promise()
};

// funzione che serializzerà tutto che è stato scritto nella history e passato al server
// per poterlo salvare nel database
proto.commit = function() {
  console.log("Sessione Committing...");
  // prelevo l'ultimo stato dei layers editati per poter
  // creare l'oggetoo post da passare al server
  this._history.getLastLayersState();
  // andà a pesacare dalla history tutte le modifiche effettuare
  // e si occuperà di di eseguire la richiesta al server di salvataggio dei dati
  return resolve();
};

//funzione di stop della sessione
proto.stop = function() {
  var self = this;
  this.state.started = false;
  var d = $.Deferred();
  console.log('Sessione stopping ..');
  // vado a ripulire tutto il featureststore
  this._featuresstore.clear();
  // vado a ripulire la storia
  this._clearHistory();
  d.resolve();
  return d.promise();

};

//ritorna l'history così che lo chiama può fare direttanmente undo e redo della history
proto.getHistory = function() {
  return this._history;
};

// funzione che fa il cera della history
proto._clearHistory = function() {
  this._history.clear();
};

module.exports = Session;