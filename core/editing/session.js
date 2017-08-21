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
      return this._start(options);
    },
    getFeatures: function(options) {
      return this._getFeatures(options);
    },
    stop: function() {
      this._stop();
    }
  };
  base(this, options);
  //attributo che stabilisce se la sessione è partita
  this.state = {
    id: options.id, // id della sessione che fa riferimento all'id del layer editato
    started: false
  };
  // editor
  this._editor = options.editor || null;
  // featuresstore che contiene tutte le modifiche che vengono eseguite al layer
  // è la versione temporanea del features store de singolo editor
  this._featuresstore = options.featuresstore || new FeaturesStore();
  // history -- oggetto che contiene gli stati dei layers
  this._history = new History({
    id: this.state.id
  });
  // contenitore temporaneo che servirà a salvare tutte le modifiche
  // temporanee che andranno poi salvate nella history e nel featuresstore
  this._temporarychanges = [];
  //dependencies
  this._dependencies = [];

}

inherit(Session, G3WObject);

var proto = Session.prototype;

proto.getId = function() {
  return this.state.id;
};

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

//funzione che server per recuperare le features
//dal server o dalla fonte delle features
proto._getFeatures = function(options) {
  var self = this;
  var d = $.Deferred();
  this._editor.getFeatures(options)
    .then(function(promise) {
      promise.then(function(features) {
        self._featuresstore.addFeatures(features);
        d.resolve(features);
      })
      .fail(function (err) {
        d.reject(err);
      });
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
  var d = $.Deferred();
  // vado a d aggiungere tutte le modifiche temporanee alla history
  // rendendole parte della sessione solo se esisitono
  if (this._temporarychanges.length) {
    options = options || {};
    var uniqueId = options.id || Date.now();
    // vado a prevedere che ne save venga passato un id che lega quella transazione(modifica) con
    // quella di un altra sessione
    if (options.id) {
      this._dependencies.push(options.id);
    }
    this._history.add(uniqueId, this._temporarychanges)
      .then(function() {
        // vado a fare il clear dei cambiamenti temporanei
        self._temporarychanges = [];
        // risolvo ritornando l'id unico
        d.resolve(uniqueId);
      });
    // andarà a popolare la history
  } else {
    d.resolve(null);
  }
  return d.promise();
};

// metodo che server ad aggiungere features temporanee che poi andranno salvate
// tramite il metodo save della sessione
proto.push = function(New, Old) {
  /*
  New e Old saranno oggetti contenti {
      layerId: xxxx,
      feature: feature
    }
   */
  // verifico se è stata passata anche l'olfFeature
  var feature = Old? [Old, New]: New;
  this._temporarychanges.push(feature);
};

proto.applyChanges = function(items, reverse) {
  reverse = reverse || true;
  ChangesManager.execute(this._featuresstore, items, reverse);
};

// funzione di rollback
// questa in pratica restituirà tutte le modifche che non saranno salvate nella history
// e nel featuresstore della sessione ma riapplicate al contrario
proto.rollback = function() {
  //vado a after il rollback dellle feature temporanee salvate in sessione
  console.log('Session Rollback.....');
  // vado a modificare il featurestore facendo il rollback dei cambiamenti temporanei
  this.applyChanges(this._temporarychanges, true);
  this._temporarychanges = [];
  return // qui vado a restituire le dipendenze
};

// funzione di undo che chiede alla history di farlo
proto.undo = function() {
  var items = this._history.undo();
  console.log(this._featuresstore);
  this.applyChanges(items.own, true);
  return items.dependencies;
};

// funzione di undo che chiede alla history di farlo
proto.redo = function() {
  var items = this._history.redo();
  this.applyChanges(items.own, true);
  return items.dependencies;
};

//funzione che prende tutte le modifche dalla storia e le
//serializza in modo da poterle inviare tramite posto al server
proto._serializeCommit = function(itemsToCommit) {
  var commitObj = {};
  var state;
  _.forEach(itemsToCommit, function(items, key) {
    commitObj[key] = {
      add: [],
      update: [],
      delete: []
    };
    _.forEach(items, function(item) {
      state = item.getState();
      var GeoJSONFormat = new ol.format.GeoJSON();
      switch (state) {
        case 'delete':
          if (!item.isNew())
            commitObj[key].delete.push(item.getId());
          break;
        default:
          commitObj[key][item.getState()].push(GeoJSONFormat.writeFeatureObject(item));
          break;
      }
    })
  });
  console.log(commitObj);
  return commitObj;
};

// funzione che mi server per ricavare quali saranno 
// gli items da committare
proto.getCommitItems = function() {
  return this._history.commit();
};

// funzione che serializzerà tutto che è stato scritto nella history e passato al server
// per poterlo salvare nel database
proto.commit = function(options) {
  var d = $.Deferred();
  options = options || {};
  var commitItems;
  console.log("Sessione Committing...");
  //vado a verificare se nell'opzione del commit
  // è stato passato gli gli ids degli stati che devono essere committati,
  //nel caso di non specifica committo tutto
  var ids = options.ids || null;
  // vado a leggete l'id dal layer necessario al server
  if (ids) {
    commitItems = this._history.commit(ids);
    this._history.clear(ids);
  } else {
    // andà a pescare dalla history tutte le modifiche effettuare
    // e si occuperà di di eseguire la richiesta al server di salvataggio dei dati
    commitItems = this._history.commit();
    this._serializeCommit(commitItems);
    // poi vado a fare tutto quello che devo fare (server etc..)
    //vado a vare il clean della history
    this._history.clear();
  }
  d.resolve(commitItems);
  return d.promise();
};

//funzione di stop della sessione
proto._stop = function() {
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