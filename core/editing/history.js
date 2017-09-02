var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Feature = require('core/layers/features/feature');

function History(options) {
  options = options || {};
  this.id = options.id;
  base(this);
  // vengono registrati tutte le modifiche
  // che sono coinvolti
  /*
  *{
  * _states: [
  *     {
  *       id: chiaveunica
  *       state: [state] // esempio history che contiene come state la/le features
  *                      // da considerare un array di stati feature perchè un tool
  *                      // può coinvolgere più features (pensiamo allo split di una feature)
  *     },
  *     {
  *       id: chiaveunica
  *       state: [state]
  *     },
  *   ]
  *     ....
  *
  *  _current: chiaveunica // questo mi server per undo/redo per spostarmi nel tempo
  *
  *
  * */
  // qui setto la massima lunghezza del "buffer history" per undo redo
  // al momento non utilizzata
  this._maxSteps = 10;
  this._states = [];
  // lo state (reattivo della history)
  this.state = {
    commit: false,
    undo:false,
    redo: false
  };
  this._current = null;
}

inherit(History, G3WObject);

var proto = History.prototype;

proto.add = function(uniqueId, items) {
  var self = this;
  //l'oggetto state non è altro che un array contenente feature/features
  // modificate in quella transazione
  var d = $.Deferred();
  var currentStateIndex;
  // prima di inserire un nuovo stato nella storia
  //verifico che siamo nell'ultimo stato (non è stato fatto nessun undo)
  // in questo modo non apro strani brach nella storia
  //Se non siamo all'ultimo, vado a cancellare cosa c'è dopo a quello attuale
  //e inserisco la nuova storia
  if (this._states.length && this._current != this.getLastState().id) {
    _.forEach(this._states, function(state, idx) {
      if (self._current == state.id) {
        currentStateIndex = idx;
        return false;
      }
    });
    //vado a sostiture il nuovo states array (una nuova storia da quel momento inizia)
    this._states = this._states.slice(0, currentStateIndex+1);
  }
    this._states.push({
    id: uniqueId,
    items: items
  });
  this._current = uniqueId;
  this._setState();
  // ritorna la chiave univoca per quella modifica vine restituita dal chiamante
  // che potrà essere utilizzata ad esempio nel salvataggio dello stato della relazione
  // settandone la staessa chiave del layer padre
  d.resolve(uniqueId);
  return d.promise();
};

// funzione interna che viene sfruttatat per cambiare lo state della history quando si
// verifica una chiamata ad una funzione che modifica lo stato della history
proto._setState = function() {
  this.canUndo();
  this.canCommit();
  this.canRedo();
};

//funzione che verifica se c'è stato un update (gli update sono formati da un array di due valori , il vecchio e il nuovo)
proto._checkItems = function(items, action) {
  /**
   * action: 0 per uno; 1: redo si riferiscono all'indice dell'array dell'item
   */
  var self = this;
  var newItems = {
    own: [], //array di modifiche da applicare al layer della sessione
    dependencies: {} // qui vengono raccolte le dependencies
  };
  _.forEach(items, function(item) {
    if (_.isArray(item))
      item = item[action];
    // vado a verificare se appartiene alla sessione
    if (self.id == item.layerId) {
      newItems.own.push(item)
    } else {
      if (!newItems.dependencies[item.layerId])
        newItems.dependencies[item.layerId] = [];
      newItems.dependencies[item.layerId].push(item);
    }
  });
  return newItems;
};

// funzione undo
proto.undo = function() {
  var self = this;
  var items;
  if (this._current == this.getFirstState().id) {
    // setto a negativo il current il che significa che posso solo andare avanti
    this._current = null;
    // restituisco l'unico stata presente
    items = this._states[0].items;
  } else {
    _.forEach(this._states, function(state, idx) {
      if (state.id == self._current) {
        items = self._states[idx].items;
        self._current = self._states[idx-1].id;
        return false;
      }
    })
  }
  items = this._checkItems(items, 0);
  this._setState();
  return items;
  
};

//funzione redo
proto.redo = function() {
  var self = this;
  var items;
  if (!this._current) {
    items = this._states[0].items;
    this._current = this._states[0].id;
    stateIdx = 1;
  } else {
    _.forEach(this._states, function(state, idx) {
      if (self._current == state.id) {
        self._current = self._states[idx+1].id;
        items = self._states[idx+1].items;
        return false;
      }
    })
  }
  items = this._checkItems(items, 1);
  this._setState();
  return items;
};

// ripulisce tutta la storia se non è stato specificato nessun ids
// ids: array di id
proto.clear = function(ids) {
  var self = this;
  if (ids) {
    _.forEach(this._states, function(state, idx) {
      if (ids.indexOf(state.id) != -1) {
        if (self._current && self._current == state.id())
          //faccio un undo
          self.undo();
        self._states.splice(idx, 1);
      }
    })
  } else {
    this._clearAll();
  }
};

// funzione che pulisce tutto states e state
proto._clearAll =  function() {
  this._states = [];
  this._current = null;
  this.state.commit = false;
  this.state.redo = false;
  this.state.undo = false;
};

// ritorna lo stato a seconda dell'id
proto.getState = function(id) {
  var state = null;
  _.forEach(this._states, function(state) {
    if (state.id == id) {
      state = state;
      return false;
    }
  });
  return state;
};

proto.getFirstState = function() {
  return this._states.length ? this._states[0] : null;
};

//restituisce l'ultimo state registrato (che non è detto sia quello corrente)
proto.getLastState = function() {
  var length = this._states.length;
  return length ? this._states[length -1] : null;
};

// funzione che mi permette di ricavare stato corrente del layer
// attualmente nella storia
proto.getCurrentState = function() {
  var self = this;
  var currentState = null;
  if (this._current && this._states.length) {
    _.forEach(this._states, function (state) {
        if (self._current == state.id) {
          currentState = state;
          return false
        }
    });
  }
  return currentState;
};

// funzione che mi permette di ricavarel'indice dello stato corrente
proto.getCurrentStateIndex = function() {
  var self = this;
  var currentStateIndex = null;
  if (this._current && this._states.length) {
    _.forEach(this._states, function (state, idx) {
      if (self._current == state.id) {
        currentStateIndex = idx;
        return false
      }
    });
  }
  return currentStateIndex;
};

// funzione che mi dice se ci sono cose da committare
proto.canCommit = function() {
  var canCommit = false;
  var idToIgnore = [];
  var statesToCommit = this._getStatesToCommit();
  _.forEach(statesToCommit, function(state) {
    _.forEach(state.items, function(item) {
      if (_.isArray(item))
      // vado a prendere il secondo valore che è quello modificato
        item = item[1];
     // se esiste un non nuovo vuol dire che
     // c'è stata fatta una modifica
     if (item.feature.isNew() && item.feature.isDeleted()) {
       idToIgnore.push(item.feature.getPk());
     } else {
       if (!(item.feature.isNew() && idToIgnore.indexOf(item.feature.getPk())!= -1) || !idToIgnore.length) {
         canCommit = true;
         return false;
       }
     }
    });
    if (canCommit) {
      return false;
    }
  });
  this.state.commit = canCommit;
  return this.state.commit;
};

//funzione che mi dice se posso fare l'undo sulla history
proto.canUndo = function() {
  var steps = (this._states.length - 1) - this.getCurrentStateIndex();
  this.state.undo = !_.isNull(this._current) && (this._maxSteps > steps);
  return this.state.undo;
};

// funzione che mi dice se posso fare il redo sulla history
proto.canRedo = function() {
  this.state.redo = this.getLastState() && this.getLastState().id != this._current || _.isNull(this._current) && this._states.length > 0;
  return this.state.redo;
};

proto._getStatesToCommit = function() {
  var self = this;
  // devo clonare lo states altrimenti ho problem con il reverse per undo e redo
  var statesToCommit = this._current ? _.clone(this._states): [];
  // qui ricavo solo la parte degli state che mi servono per ricostruire la storia
  _.forEach(statesToCommit.reverse(), function(state, idx) {
    if (self.getCurrentState() == state) {
      // in pratica taglio il pezzo di storia "dopo" il current
      statesToCommit = statesToCommit.slice(idx, statesToCommit.length);
      return false;
    }
  });
  return statesToCommit;
};

//funzione che restituisce tutte le modifche uniche da applicare (mandare al server)
proto.commit = function() {
  // contegono oggetti aventi lo stato di una feature unica e il relativo id
  var commitItems = {};
  var feature;
  var layerId;
  var add = true;
  var statesToCommit = this._getStatesToCommit();
  // inzioa ascorrere sugli stati della history
  _.forEach(statesToCommit, function (state) {
    //ciclo sugli items dello stato
    _.forEach(state.items, function(item) {
      console.log(item);
      // nel caso di un array, quindi di fronte ad un update
      if (_.isArray(item))
        // vado a prendere il secondo valore che è quello modificato
        item = item[1];
      //vado a ciclare sugli evtnuali stati committati cioè aggiunti
      _.forEach(commitItems[item.layerId], function(commitItem, idx) {
        //verifico se presente uno stesso ite
        if (commitItem.getId() == item.feature.getId()) {
          // verifcio inoltre se è una feature nuova, se non è stata cancellata (già presente nei commitItems) e se aggiunta
          // perchè allora setto come add
          if (item.feature.isNew() && !commitItem.isDeleted()  && item.feature.isAdded()) {
            // allora setto l'ultima versione allo stato add
            commitItem.add();
          }
          add = false;
          return false;
        }
      });
      // se true significa che lo devo aggiungere
      if (add) {
        feature = item.feature;
        layerId = item.layerId;
        // vado a verificar condizioni
        if (!(!feature.isNew() && feature.isAdded())) {
          if (!commitItems[layerId])
            commitItems[layerId] = [];
          commitItems[layerId].push(feature);
        }
      }
      // risetto a true
      add = true;
    });
  });
  return commitItems;
};

module.exports = History;