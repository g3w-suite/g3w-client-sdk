var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var History = require('./history');
var FeaturesStore = require('core/layers/features/featuresstore');
var ChangesManager = require('./changesmanager');

// classe Session
function Session(options) {
  options = options || {};
  this.setters = {
    // setter per start
    start: function(options) {
      this._start(options);
    },
    stop: function() {
      this._stop();
    }
  };
  base(this, options);
  //attributo che stabilisce se la sessione è partita
  this.state = {
    started: false
  };
  // editor
  this._editor = options.editor || null;
  // featuresstore che contiene tutte le modifiche che vengono eseguite al layer
  // è la versione temporanea del features store de singolo editor
  this._featuresstore = options.featuresstore || new FeaturesStore();
  // history -- oggetto che contiene gli stati dei layers
  this._history = new History();
  // contenitore temporaneo che servirà a salvare tutte le modifiche
  // temporanee che andranno poi salvate nella history e nel featuresstore
  this._temporarychanges = [];
}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto._start = function(options) {
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
  return this.state.started;
};

proto.getEditor = function() {
  return this._editor;
};

proto.setEditor = function(editor) {
  this._editor = editor;
};

//restituisce il feature store della sessione
proto.getFeaturesStore = function() {
  return this._featuresstore;
};

// questa funzione sarà adibita al salvataggio (temporaneo) delle modifiche
// al layer sia nella history che nel featuresstore
proto.save = function(options) {
  //vado a pololare la history
  console.log("Session Saving .... ");
  var self = this;
  options = options || {};
  var d = $.Deferred();
  // vado a prevedere che ne save venga passato un id che lega quella transazione(modifica) con
  // quella di un altra sessione
  var uniqueId = options.id || Date.now();
  // vado a d aggiungere tutte le modifiche temporanee alla history
  // rendendole parte della sessione
  this._history.add(uniqueId, this._temporarychanges)
    .then(function() {
      // vado a fare il clear dei cambiamenti temporanei
      self._temporarychanges = [];
      // risolvo ritornando l'id unico
      d.resolve(uniqueId);
    });
  // andarà a popolare la history
  return d.promise();
};

// metodo che server ad aggiungere features temporanee che poi andranno salvate
// tramite il metodo save della sessione
proto.push = function(feature) {
  //applico i cambiamenti al featuresstore;
  ChangesManager.execute(this._featuresstore, [feature]);
  this._temporarychanges.push(feature);
};

// funzione di rollback
// questa in pratica restituirà tutte le modifche che non saranno salvate nella history
// e nel featuresstore della sessione ma riapplicate al contrario
proto.rollback = function() {
  var d = $.Deferred();
  //vado a after il rollback dellle feature temporanee salvate in sessione
  console.log('Session Rollback.....');
  // vado a modificare il featurestore facendo il rollback dei cambiamenti temporanei
  ChangesManager.execute(this._featuresstore, this._temporarychanges, true);
  this._temporarychanges = [];
  d.resolve();
  return d.promise()
};

// funzione di undo che chiede alla history di farlo
proto.undo = function() {
  var self = this;
  this._history.undo()
    .then(function(items) {
      ChangesManager.execute(self._featuresstore, items, true);
    })
};

// funzione di undo che chiede alla history di farlo
proto.redo = function() {
  var self = this;
  this._history.redo()
    .then(function(items) {
      ChangesManager.execute(self._featuresstore, items, true);
    })
};

//funzione che prende tutte le modifche dalla storia e le
//serializza in modo da poterle inviare tramite posto al server
proto._serializeCommit = function() {

};

// funzione che serializzerà tutto che è stato scritto nella history e passato al server
// per poterlo salvare nel database
proto.commit = function() {
  var d = $.Deferred();
  console.log("Sessione Committing...");
  // andà a pesacare dalla history tutte le modifiche effettuare
  // e si occuperà di di eseguire la richiesta al server di salvataggio dei dati
  this._history.commit();
  d.resolve();
  this._history.clear();
  return d.promise();
};

//funzione di stop della sessione
proto._stop = function() {
  var self = this;
  this.state.started = false;
  var d = $.Deferred();
  console.log('Sessione stopping ..');
  this.clear();
  d.resolve();
  return d.promise();

};

// clear di tutte le cose associate alla sessione
proto.clear = function() {
  // vado a ripulire tutto il featureststore
  this._featuresstore.clear();
  // vado a ripulire la storia
  this._clearHistory();
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