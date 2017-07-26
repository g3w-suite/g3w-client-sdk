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
  this._historyDependencies = [];
}

inherit(History, G3WObject);

var proto = History.prototype;

proto.add = function(uniqueId, state) {
  // l'oggetto state conterrà informazioni sul tipo di
  // azione fatta e i dati coinvolti ne cambio di stato
  /*
  * es {
  *   type: add,
  *   data: data
  * }
  * */
  var d = $.Deferred();
  this._states.push({
    id: uniqueId,
    state: state
  });
  this._current = uniqueId;
  // ritorna la chiave univoca per quella modifica vine restituita dal chiamante
  // che potrà essere utilizzata ad esempio nel salvataggio dello stato della relazione
  // settandone la staessa chiave del layer padre
  d.resolve();
  return d.promise();
};


// funzione redo
proto.undo = function() {
  var self = this;
  var state;
  if (this._states.length > 1) {
    _.forEach(this._states, function(state, idx) {
      if (state.id == self._current) {
        state = self._states[idx-1];
        self._current = state.id;
        return false;
      }
    })
  } else {
    // setto a negativo il current il che significa che posso solo andare avanti
    this._current = null;
  }
  //this._undoRelatedLayers(oldStateId);
  return state
};

//funzione undo
proto.redo = function(layerId) {
  var self = this;
  var state;
  if (!this._current) {
    state = this._states.state[0];
    this._current = state.id;
  } else {
    _.forEach(this._states, function(state, idx) {
      if (self._current == state.id) {
        state = self._states[idx+1];
        self._current = state.id;
        return false;
      }
    })
  }
  //this._redoRelatedLayers(oldStateId);
  return state;
};

// funzione che mi fa il redo su eventuali layers che nanno lo stesso current uninque id
// cosa che specifica la relazione tra layer
proto._redoRelatedLayers = function(oldStateId) {
  var self = this;
  _.forEach(this.layers, function(layer, layerId) {
    if (layer.current == oldStateId) {
      self.redo(layerId);
    }
  })
};

// funzione che mi fa il undo su eventuali layers che nanno lo stesso current uninque id
// cosa che specifica la relazione tra layer
proto._undoRelatedLayers = function(oldStateId) {
  var self = this;
  _.forEach(this.layers, function(layer, layerId) {
    if (layer.current == oldStateId) {
      self.undo(layerId);
    }
  })
};

proto.clear = function() {
  this._states = [];
  this._current = null;
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