const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const History = require('./history');
const FeaturesStore = require('core/layers/features/featuresstore');
const ChangesManager = require('./changesmanager');
const SessionsRegistry = require('./sessionsregistry');

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
}

inherit(Session, G3WObject);

const proto = Session.prototype;

proto.getId = function() {
  return this.state.id;
};

proto._start = function(options) {
  const d = $.Deferred();
  // vado a registrare la sessione
  SessionsRegistry.register(this);
  this._editor.start(options)
    .then((features) => {
      features = this._cloneFeatures(features);
      // vado a popolare il featuresstore della sessione con le features
      //che vengono caricate via via dall'editor
      this._featuresstore.setFeatures(features);
      this.state.started = true;
      d.resolve(features);
    })
    .fail((err) => {
      this.state.started = true;
      d.reject(err);
    });
  return d.promise();
};

//funzione che server per recuperare le features
//dal server o dalla fonte delle features
proto._getFeatures = function(options) {
  const d = $.Deferred();
  this._editor.getFeatures(options)
    .then((promise) => {
      promise.then((features) => {
        features = this._cloneFeatures(features);
        this._featuresstore.addFeatures(features);
        d.resolve(features);
      })
      .fail((err) => {
        d.reject(err);
      });
    });
  return d.promise();
};

// funzione che permette di clonerae le feature che vengono reperite tramite editor
proto._cloneFeatures = function(features) {
  var cloneFeatures = [];_.forEach(features, function(feature) {
    cloneFeatures.push(feature.clone())
  });
  return cloneFeatures;
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
  //fill history
  //console.log("Session Saving .... ");
  var self = this;
  var d = $.Deferred();
  // add temporary modify to history
  if (this._temporarychanges.length) {
    options = options || {};
    var uniqueId = options.id || Date.now();
    this._history.add(uniqueId, this._temporarychanges)
      .then(function() {
        // clear to trmporary changes
        self._temporarychanges = [];
        // resolve if uniqeu id
        d.resolve(uniqueId);
      });
  } else {
    d.resolve(null);
  }
  return d.promise();
};

proto.pushAdd = function(layerId, feature) {
  this.push({
    layerId: layerId,
    feature: feature.add()
  })
};


// metodo per aggiungere la cancellazione di una feature temporaneamente
proto.pushDelete = function(layerId, feature) {
  this.push({
    layerId: layerId,
    feature: feature.delete()
  })
};

// metodo per aggiungere temporaneamente la modifica di una feature
proto.pushUpdate = function(layerId, newFeature, oldFeature) {

  this.push(
    {
      layerId: layerId,
      feature: newFeature.update()
    },
    {
      layerId: layerId,
      feature: oldFeature.update()

    })
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

proto._applyChanges = function(items, reverse) {
  reverse = reverse || true;
  ChangesManager.execute(this._featuresstore, items, reverse);
};


// funzione che permetterà di cancellare tutte le modifiche salvate nella history
// e quindi ripulire la sessione
proto.revert = function() {
  var d = $.Deferred();
  var self = this;
  this._editor.getFeatures().then(function(promise) {
    promise
      .then(function(features) {
        features =  self._cloneFeatures(features);
        self.getFeaturesStore().setFeatures(features);
        self._history.clear();
        d.resolve();
      })
      .fail(function(err) {
        d.reject(err);
      })
  });
  return d.promise();
};

// organizza i cambiamenti temporanei in base al layer coinvolto
proto._filterChanges = function() {
  var id = this.getId();
  var changes = {
    own:[],
    dependencies: {}
  };
  var change;
  _.forEach(this._temporarychanges, function(temporarychange) {
    change = _.isArray(temporarychange) ? temporarychange[0] : temporarychange;
    if (change.layerId == id)
      changes.own.push(change);
    else {
      if (!changes.dependencies[change.layerId])
        changes.dependencies[change.layerId] = [];
      // le vado a posizionare dal più recente al più lontano in ordine inverso FILO
      changes.dependencies[change.layerId].unshift(change);
    }
  });
  return changes;
};

// funzione di rollback
// questa in pratica restituirà tutte le modifche che non saranno salvate nella history
// e nel featuresstore della sessione ma riapplicate al contrario
proto.rollback = function(changes) {
  //vado a after il rollback dellle feature temporanee salvate in sessione
  //console.log('Session Rollback.....', changes);
  var d = $.Deferred();
  if (changes) {
    this._applyChanges(changes, true);
    d.resolve();
  }  else {
    changes = this._filterChanges();
    // vado a modificare il featurestore facendo il rollback dei cambiamenti temporanei
    this._applyChanges(changes.own, true);
    this._temporarychanges = [];
    d.resolve(changes.dependencies);
  }
  return d.promise()// qui vado a restituire le dipendenze
};

// funzione di undo che chiede alla history di farlo
proto.undo = function(items) {
  var items = items || this._history.undo();
  this._applyChanges(items.own, true);
  return items.dependencies;
};

// funzione di undo che chiede alla history di farlo
proto.redo = function(items) {
  var items = items || this._history.redo();
  this._applyChanges(items.own, true);
  return items.dependencies;
};

//funzione che prende tutte le modifche dalla storia e le
//serializza in modo da poterle inviare tramite posto al server
proto._serializeCommit = function(itemsToCommit) {
  // id del layer legato alla sessione
  var id = this.getId();
  var state;
  var layer;
  var commitObj = {
    add: [],
    update: [],
    delete: [],
    relations: {}
  };
  _.forEach(itemsToCommit, function(items, key) {
    if (key != id) {
      // vado a recuperare i lockId del layer relaione
      var lockids = SessionsRegistry.getSession(key).getEditor().getLayer().getFeaturesStore().getLockIds();
      // vado a creare una nuova chiave nelle relazioni
      commitObj.relations[key] = {
        lockids:lockids,
        add: [],
        update: [],
        delete: []
      };
      layer = commitObj.relations[key];
      // e assegno struttura per il commit
    } else {
      layer = commitObj
    }
    _.forEach(items, function(item) {
      state = item.getState();
      var GeoJSONFormat = new ol.format.GeoJSON();
      switch (state) {
        case 'delete':
          if (!item.isNew())
            layer.delete.push(item.getId());
          break;
        default:
          const value = GeoJSONFormat.writeFeatureObject(item);
          for (const key in value.properties) {
           if (value.properties[key] && typeof value.properties[key] === 'object' && value.properties[key].constructor === Object)
             value.properties[key] = value.properties[key].value;
          }
          layer[item.getState()].push(value);
          break;
      }
    });
  });
  return commitObj;
};

// funzione che mi server per ricavare quali saranno
// gli items da committare
proto.getCommitItems = function() {
  var commitItems = this._history.commit();
  return this._serializeCommit(commitItems);
};

// funzione che serializzerà tutto che è stato scritto nella history e passato al server
// per poterlo salvare nel database
proto.commit = function(options) {
  options = options || {};
  var self = this;
  var d = $.Deferred();
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
    // le serializzo
    commitItems = this._serializeCommit(commitItems);
    // passo all'editor un secondo parametro.
    this._editor.commit(commitItems, this._featuresstore)
      .then(function(response) {
        // poi vado a fare tutto quello che devo fare (server etc..)
        //vado a vare il clean della history
        self._history.clear();
        d.resolve(commitItems, response)
      })
      .fail(function(err) {
        d.reject(err);
      });
  }

  return d.promise();
};

//funzione di stop della sessione
proto._stop = function() {
  var self = this;
  var d = $.Deferred();
  // vado a unregistrare la sessione
  SessionsRegistry.unregister(this.getId());
  console.log('Sessione stopping ..');
  this._editor.stop()
    .then(function() {
      self.state.started = false;
      self.clear();
      d.resolve();
    })
    .fail(function(err) {
      console.log(err);
      d.reject(err);
    });
  return d.promise();

};

// clear di tutte le cose associate alla sessione
proto.clear = function() {
  this._editor.clear();
  // vado a ripulire la storia
  this._clearHistory();
  // risetto il featurestore a nuovo
  this._featuresstore.clear();
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
