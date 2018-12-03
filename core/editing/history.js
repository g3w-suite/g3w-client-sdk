const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

function History(options) {
  options = options || {};
  this.id = options.id;
  base(this);
  // registered all changes
  /*
  *{
  * _states: [
  *     {
  *       id: unique key
  *       state: [state] // example: history contsins features state
  *                      // array because a tool can apply changes to more than one features at time (split di una feature)
  *     },
  *     {
  *       id: unique key
  *       state: [state]
  *     },
  *   ]
  *     ....
  *
  *  _current: unique key // usefult to undo redo
  *
  *
  * */
  // set maximun "buffer history" lenght for  undo redo
  this._maxSteps = 10;
  this._states = [];
  // reactive state of histrory
  this.state = {
    commit: false,
    undo:false,
    redo: false
  };
  this._current = null; // store the current state of history (useful for undo /redo)
}

inherit(History, G3WObject);

const proto = History.prototype;

proto.add = function(uniqueId, items) {
  //state object is an array of feature/features changed in a transaction
  const d = $.Deferred();
  let currentStateIndex;
  // before insert an item into the history
  // check if are at last state step (no redo was done)
  // in this way avoid starge barch in the history
  //If we are in the middle of undo, delete all changes in the histroy from the current "state"
  // so i can create a new history
  if (this._states.length && this._current != this.getLastState().id) {
    this._states.find((state, idx) => {
      if (this._current == state.id) {
        currentStateIndex = idx;
        return true;
      }
    });
    //substitute new state
    this._states = this._states.slice(0, currentStateIndex + 1);
  }
    this._states.push({
    id: uniqueId,
    items: items
  });
  this._current = uniqueId;
  this._setState();
  // return unique id key
  // it can be used in save relation
  d.resolve(uniqueId);
  return d.promise();
};

// internal method to change the state of the  history when we check
// a call to a function that modify the hsitory state
proto._setState = function() {
  this.canUndo();
  this.canCommit();
  this.canRedo();
};

//check if was did an update (update are array contains two items , old e new value)
proto._checkItems = function(items, action) {
  /**
   * action: 0 per uno; 1: redo reffererd to array index
   */
  const newItems = {
    own: [], //array of changes of layer of the current session
    dependencies: {} // dependencies
  };
  items.forEach((item) => {
    if (_.isArray(item))
      item = item[action];
    // check if belong to session
    if (this.id == item.layerId) {
      newItems.own.push(item)
    } else {
      if (!newItems.dependencies[item.layerId])
        newItems.dependencies[item.layerId] = {
          own: [],
          dependencies: {}
        };
      newItems.dependencies[item.layerId].own.push(item);
    }
  });
  return newItems;
};

// mehtod undo
proto.undo = function() {
  let items;
  if (this._current == this.getFirstState().id) {
    this._current = null;
    items = this._states[0].items;
  } else {
    this._states.find((state, idx) => {
      if (state.id == this._current) {
        items = this._states[idx].items;
        this._current = this._states[idx-1].id;
        return true;
      }
    })
  }
  items = this._checkItems(items, 0);
  this._setState();
  return items;

};

//funzione redo
proto.redo = function() {
  let items;
  if (!this._current) {
    items = this._states[0].items;
    this._current = this._states[0].id;
    stateIdx = 1;
  } else {
    this._states.find((state, idx) => {
      if (this._current == state.id) {
        this._current = this._states[idx+1].id;
        items = this._states[idx+1].items;
        return true;
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
  if (ids) {
    this._states.forEach((state, idx) => {
      if (ids.indexOf(state.id) != -1) {
        if (this._current && this._current == state.id())
          //faccio un undo
          this.undo();
        this._states.splice(idx, 1);
      }
    })
  } else {
    this._clearAll();
  }
};

// funzione che pulisce tutto states
proto._clearAll =  function() {
  this._states = [];
  this._current = null;
  this.state.commit = false;
  this.state.redo = false;
  this.state.undo = false;

};

// ritorna lo stato a seconda dell'id
proto.getState = function(id) {
  let state = null;
  this._states.forEach((state) => {
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
  const length = this._states.length;
  return length ? this._states[length -1] : null;
};

// funzione che mi permette di ricavare stato corrente del layer
// attualmente nella storia
proto.getCurrentState = function() {
  let currentState = null;
  if (this._current && this._states.length) {
    this._states.forEach((state) => {
        if (this._current == state.id) {
          currentState = state;
          return false
        }
    });
  }
  return currentState;
};

// funzione che mi permette di ricavarel'indice dello stato corrente
proto.getCurrentStateIndex = function() {
  let currentStateIndex = null;
  if (this._current && this._states.length) {
    this._states.forEach((state, idx) => {
      if (this._current == state.id) {
        currentStateIndex = idx;
        return false
      }
    });
  }
  return currentStateIndex;
};

// funzione che mi dice se ci sono cose da committare
proto.canCommit = function() {
  let canCommit = false;
  let idToIgnore = [];
  const statesToCommit = this._getStatesToCommit();
  statesToCommit.forEach((state) => {
    state.items.forEach((item) => {
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
  const steps = (this._states.length - 1) - this.getCurrentStateIndex();
  this.state.undo = !_.isNull(this._current) && (this._maxSteps > steps);
  return this.state.undo;
};

// funzione che mi dice se posso fare il redo sulla history
proto.canRedo = function() {
  this.state.redo = this.getLastState() && this.getLastState().id != this._current || _.isNull(this._current) && this._states.length > 0;
  return this.state.redo;
};

proto._getStatesToCommit = function() {
  // devo clonare lo states altrimenti ho problem con il reverse per undo e redo
  let statesToCommit = this._current ? [...this._states]: [];
  // qui ricavo solo la parte degli state che mi servono per ricostruire la storia
  statesToCommit.reverse().forEach((state, idx) => {
    if (this.getCurrentState() === state) {
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
  let commitItems = {};
  let feature;
  let layerId;
  const statesToCommit = this._getStatesToCommit();
  // inzioa ascorrere sugli stati della history
  statesToCommit.forEach((state) => {
    //ciclo sugli items dello stato
    state.items.forEach((item) => {
      let add = true;
      // nel caso di un array, quindi di fronte ad un update
      if (Array.isArray(item))
        // vado a prendere il secondo valore che è quello modificato
        item = item[1];
      //vado a ciclare sugli evtnuali stati committati cioè aggiunti
      commitItems[item.layerId] && commitItems[item.layerId].forEach((commitItem) => {
        //verifico se presente uno stesso ite
        if (commitItem.getId() === item.feature.getId()) {
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
    });
  });
  return commitItems;
};

module.exports = History;
