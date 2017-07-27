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
  //verifico che siamo nell'ultimo stao (non è stato fatto nessun undo)
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
    //vado a sostiture
    this._states = this._states.slice(0, currentStateIndex+1);
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
  return items
};

//funzione redo
proto.redo = function(layerId) {
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
  return items;
};


proto.clear = function() {
  this._states = [];
  this._current = null;
};

proto.getFirstState = function() {
  return this._states[0];
};

// funzione che mi permette di ricavare l'ultimo stato del layer
proto.getLastState = function() {
  if (this._states.length)
    return this._states[this._states.length - 1];
  return null;
};

//funzione che mi dice se posso fare l'undo sulla history
proto.canUndo = function() {
  return !_.isNull(this._current);
};

// funzione che mi dice se posso fare il redo sulla history
proto.canRedo = function() {
  return (_.isNull(this._current) && this._states.length > 0) || (this.getLastState() && this.getLastState().id != this._current);
};

module.exports = History;