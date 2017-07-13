var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function History() {
  base(this);

  // vengono registrati tutti i layers
  // che sono coinvolti
  /*
  * La struttura sarà
  * layerid: {
  *   states: [
  *     {
  *       id: chiaveunica
  *       add:[features],
  *       delete:[features],
  *       update:[features]
  *     },
  *     {
  *       id: chiaveunica
  *       add:[features],
  *       delete:[features],
  *       update:[features]
  *     },
  *   ]
  *     ....
  *  },
  *  current: chiaveunica // questo mi server per undo/redo
  * },
  * layerid: {
  *   states: [
  *     {
  *       id: chiaveunica
  *       add:[features],
  *       delete:[features],
  *       update:[features]
  *     },
  *     {
  *       id: chiaveunica
  *       add:[features],
  *       delete:[features],
  *       update:[features]
  *     },
  *   ]
  *     ....
  *  },
  *  current: chiaveunica // questo mi server per undo/redo
  * },
  * */
  this.layers = {};
}

inherit(History, G3WObject);

var proto = History.prototype;

proto.add = function(layerId, state, uniqueId) {
  // l'oggetto state conterrà informazioni sul tipo di
  // azione fatta e i dati coinvolti ne cambio di stato
  /*
  * es {
  *   type: add,
  *   data: data
  * }
  * */
  var uniqueId = uniqueId || Date.now();
  if (!this.layers[layerId]) {
    // questo viene previsto nel caso di una relazione
    // che viene sempre modficata dal layer padre e quindi passerà
    // il suo timestamp
    // contiene l'array di tutte degli oggetti di tutte le moedifiche
    // di quel layer (utile a svolgere l'undo/redo)
    this.layers[layerId] = {
      states: []
    };
  }
  this.layers[layerId].states.push({
    id: uniqueId,
    add: [],
    delete: [],
    update: []
  });
  this.layers[layerId].current = uniqueId;
  // ritorna la chiave univoca per quella modifica vine restituita dal chiamante
  // che potrà essere utilizzata ad esempio nel salvataggio dello stato della relazione
  // settandone la staessa chiave del layer padre
  return uniqueId;
};

// mi serve per rimuovere il layer dalla history
proto.delete = function(layerId) {
  // vado a rimuovere il layer dalla history rimuoendo anche tutti
  // le relazione (timestamp ugulai) sugli altri layers
};

// funzione redo
proto.undo = function(layerId) {
  var layer = this.layers[layerId];
  var oldStateId;
  var state = null;
  if (layer.states.length > 1) {
    _.forEach(layer.states, function(layerState, idx) {
      if (layer.current == layerState.id) {
        oldStateId = layerState.id;
        state = layer.state[idx-1];
        layer.current = state.id;
      }
    })
  } else {
    oldStateId = layer.states[0].id;
    // setto a negativo il current il che significa che posso solo andare avanti
    layer.current = -1;
  }
  this._undoRelatedLayers(oldStateId);
  return state
};

//funzione undo
proto.redo = function(layerId) {
  var layer = this.layers[layerId];
  var state = null;
  var oldStateId;
  if (layer.current < 0) {
    state = layers.state[0];
    oldStateId = state.id;
    layer.current = state.id;
  } else {
    _.forEach(layer.states, function(layerState, idx) {
      if (layer.current == layerState.id) {
        oldStateId = layerState.id;
        state = layer.state[idx+1];
        layer.current = state.id;
        return false;
      }
    })
  }
  this._redoRelatedLayers(oldStateId);
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

proto.clear = function(layerId) {
  var layer = this._layers[layerId];
  var currentId = layer.current;
  if (currentId > 0) {
    delete this.layers[layerId];
    _.forEach(this.layers, function(layer, layerId) {
      if (layer.current == currentId) {
        delete self.layers[layerId];
      }
    })
  } else {
    // dovrei controllasre se ci sono id dello stato che hanno altri layer
  }
};


proto.clearAll = function() {
  this.layers = {};
};

// funzione che mi permette di ricavare l'ultimo stato del layer
proto.getLastLayerState = function(layerId) {
  var layer = this.layers[layerId];
  var currentStateId = layer.current;
  var state = null;
  _.forEach(layer.states, function(layerState, idx) {
     if (layerState.id == currentStateId) {
       state = layer.states[idx];
       return false;
     }
  });
  return state;
};

// funzione che mi permette di ricavare l'ultimo stato del layer
proto.getLastLayersState = function() {
  var self = this;
  var states = [];
  var state;
  _.forEach(this.layers, function(layer, layerId) {
    state = {};
    state[layerId] = self.getLastLayerState(layerId);
    states.push(state);
  });
  return states;
};



testhistory = new History();
module.exports = History;