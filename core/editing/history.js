var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function History() {
  base(this);

  // vengono registrati tutte le modifiche
  // che sono coinvolti
  /*{
  *
  * states: [
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
  *  },
  *  current: chiaveunica // questo mi server per undo/redo per spostarmi nel tempo
  *
  * },
  * */
  // qui setto la massima lunghezza del "buffer history" per undo redo
  // al momento non utilizzata
  this._maxLength = 10;
  this._states = [];
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
    console.log('sono qui a riscrivere la storia');
    this._states = this._states.slice(0, currentStateIndex+1);
    console.log(this._states);
  }
  this._states.push({
    id: uniqueId,
    items: items
  });
  this._current = uniqueId;
  // ritorna la chiave univoca per quella modifica vine restituita dal chiamante
  // che potrà essere utilizzata ad esempio nel salvataggio dello stato della relazione
  // settandone la staessa chiave del layer padre
  d.resolve();
  return d.promise();
};

// funzione undo
proto.undo = function() {
  var d = $.Deferred();
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
  d.resolve(items);
  return d.promise();
};

//funzione redo
proto.redo = function(layerId) {
  var d = $.Deferred();
  var self = this;
  var items;
  if (!this._current) {
    items = this._states[0].items;
    this._current = this._states[0].id;
  } else {
    _.forEach(this._states, function(state, idx) {
      if (self._current == state.id) {
        items = self._states[idx+1].items;
        self._current = self._states[idx+1].id;
        return false;
      }
    })
  }
  d.resolve(items);
  return d.promise();
};

// riplusce tutta la storia
proto.clear = function() {
  this._states = [];
  this._current = null;
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
  var lastState;
  if (this._states.length) {
    _.forEach(this._states, function (state) {
        if (self._current == state.id) {
          lastState = state;
          return false
        }
    });
  }
  return lastState;
};

//funzione che mi dice se posso fare l'undo sulla history
proto.canUndo = function() {
  return !_.isNull(this._current);
};

// funzione che mi dice se posso fare il redo sulla history
proto.canRedo = function() {
  return (_.isNull(this._current) && this._states.length > 0) || (this.getLastState() && this.getLastState().id != this._current);
};

//funzione che restituisce tutte le modifche uniche da applicare (mandare al server)
proto.commit = function() {
  var self = this;
  // contegono oggetti aventi lo stato di una feature unica e il relativo id
  var commitItems = {
    id:[], // gli id unicimi serivranno per capire le dipendenze
    items:[] // le features modificate
  };
  var add = true;
  // qui ricavo solo la parte degli state che mi servono per ricostruire la storia
  _.forEach(this._states.reverse(), function(state, idx) {
    if (self.getCurrentState() == state) {
      self._states = self._states.slice(idx, self._states.length);
      return false;
    }
  });
  _.forEach(this._states, function (state) {
    _.forEach(state.items, function(item) {
      _.forEach(commitItems.items, function(commitItem) {
        //verifico se presente uno stesso item
        if (commitItem.getId() == item.getId()) {
          add = false;
          return false;
        }
      });
      // se true sinifica che lo devo aggiungere
      if (add)
        // vado a verificare che non sia stato cancellato un aggiunto nuovo o che sia stato riaggiunto un essistente (undo/redo)
        if (item.getId() > 0 && item.getState() != 'add' || item.getState() == 'delete' && item.getId().indexOf('__new__') == -1) {
          commitItems.id.push(state.id);
          commitItems.items.push(item)
        }
      // risetto a true
      add = true;
    });
  });
  return commitItems;
};

module.exports = History;