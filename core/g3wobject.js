var inherit = require('core/utils/utils').inherit;
var noop = require('core/utils/utils').noop;

/**
 * Un oggetto base in grado di gestire eventuali setter e relativa catena di listeners.
 * @constructor
 */
var G3WObject = function() {
  //quando istanzio l'oggetto verifico che nella sua proprietà
  // ci sia l'attributo setters. Se si vado a registare la catena di eventi
  // per poter registare azioni prima e dopo la chiamata del metodo
  if (this.setters) {
    this._setupListenersChain(this.setters);
  }
};

inherit(G3WObject, EventEmitter);

var proto = G3WObject.prototype;

/**
 * Inserisce un listener dopo che è stato eseguito il setter
 * @param {string} setter - Il nome del metodo su cui si cuole registrare una funzione listener
 * @param {function} listener - Una funzione listener (solo sincrona)
 * @param {number} priority - Priorità di esecuzione: valore minore viene eseuito prima
 */
proto.onafter = function(setter, listener, priority){
  return this._onsetter('after', setter, listener, false, priority);
};

// un listener può registrarsi in modo da essere eseguito PRIMA dell'esecuzione del metodo setter. Può ritornare true/false per
// votare a favore o meno dell'esecuzione del setter. Se non ritorna nulla o undefined, non viene considerato votante
/**
 * Inserisce un listener prima che venga eseguito il setter. Se ritorna false il setter non viene eseguito
 * @param {string} setter - Il nome del metodo su cui si cuole registrare una funzione listener
 * @param {function} listener - Una funzione listener, a cui viene passato una funzione "next" come ultimo parametro, da usare nel caso di listener asincroni
 * @param {number} priority - Priorità di esecuzione: valore minore viene eseuito prima
 */
proto.onbefore = function(setter, listener, priority) {
  return this._onsetter('before', setter, listener, false, priority);
};

/**
 * Inserisce un listener prima che venga eseguito il setter. Al listener viene passato una funzione "next" come ultimo parametro, da chiamare con parametro true/false per far proseguire o meno il setter
 * @param {string} setter - Il nome del metodo su cui si cuole registrare una funzione listener
 * @param {function} listener - Una funzione listener, a cui
 * @param {number} priority - Priorità di esecuzione: valore minore viene eseuito prima
 */
proto.onbeforeasync = function(setter, listener, priority) {
  return this._onsetter('before', setter, listener, true, priority);
};

proto.un = function(setter, key){
  _.forEach(this.settersListeners,function(settersListeners) {
    _.forEach(settersListeners[setter],function(setterListener, idx) {
      if(setterListener.key == key) {
        settersListeners[setter].slice(idx, 1);
      }
    })
  })
};

// funzione che si occupa di settare le funzioni legate al setter in base alla tipologia
// di evento se prima o dopo
/*
  when=before|after,
  type=sync|async
*/
proto._onsetter = function(when, setter, listener, async, priority) {
  // vado a recuperarer l'oggetto che ceh si riferifsce al when
  var settersListeners = this.settersListeners[when];
  // creo una listenerKey unica
  var listenerKey = ""+Math.floor(Math.random()*1000000)+""+Date.now();
  // verifico la priorità
  priority = priority || 0;
  // prendo tutto ciò che riguarda il setter (la funzione che dovrà essere chiamata)
  var settersListeneres = settersListeners[setter];
  // vado ad inserire l'oggetto che mi servirà a chiamare la funzione legata
  // al tipo di evento del setter
  settersListeneres.push({
    key: listenerKey,
    fnc: listener,
    async: async,
    priority: priority
  });
  // vado a riordinare l'array dei listeners del setter per quell'evento in base alla priorità
  settersListeners[setter] = _.sortBy(settersListeneres, function(setterListener) {
    return setterListener.priority;
  });
  // ritorno la chiave
  return listenerKey;
};

// funzione che viene lanciata se la sottoclasse ha come parametro setters
proto._setupListenersChain = function(setters) {
  // inizializza tutti i metodi definiti nell'oggetto "setters" della classe figlia.
  var self = this;
  this.settersListeners = {
    after: {},
    before: {}
  };
  // per ogni setter viene definito l'array dei listeners e fiene sostituito
  // il metodo originale con la funzioni che gestisce la coda di listeners
  // setterOption è la funzione
  // stters è la chiave/nome del metodo che viene assegnato all'istanza
  _.forEach(setters, function(setterOption, setter) {
    var setterFnc = noop;
    var setterFallback = noop;
    // verifico che il valore della chiave setter sia una funzione
    if (_.isFunction(setterOption)){
      setterFnc = setterOption
    } // altrimenti vado a vedere il valore dell'attributo fnc
    else {
      setterFnc = setterOption.fnc;
      setterFallback = setterOption.fallback || noop; // funzione in caso di errore nell'esecuzione della fnc
    }
    //vado a creare l'arry dei metodi/azioni/funzioni che devo essere eseguiti prima/dopo
    //la chiamata del metodo sette dell'oggetto
    self.settersListeners.after[setter] = [];
    self.settersListeners.before[setter] = [];
    // setter aggiunto come proprietà dell'istanza
    self[setter] = function() {
      // prendo gli argomenti passati alla funzione
      var args = arguments;
      var deferred = $.Deferred();
      var returnVal = null;
      var counter = 0;
      // funzione complete che serve per lanciare la funzione setter dell'istanza
      function complete() {
        // eseguo la funzione setter
        returnVal = setterFnc.apply(self,args);
        // e risolvo la promessa (eventualmente utilizzata da chi ha invocato il setter)
        deferred.resolve(returnVal);
        //vado a eseguire tutti i listener che sono stati settati dopo l'esecuzione del setter
        var afterListeners = self.settersListeners.after[setter];
        _.forEach(afterListeners, function(listener) {
          listener.fnc.apply(self, args);
        })
      }
      // funzione abort che mi server ad uscire dal ciclo dei listener
      // nel caso si verificasse un problema
      function abort() {
        // se non posso proseguire ...
        // chiamo l'eventuale funzione di fallback
        setterFallback.apply(self,args);
        // e rigetto la promessa
        deferred.reject();
      }

      // vado a prendere l'array delle funzioni che devo lanciare prima di lanciare il setter
      var beforeListeners = self.settersListeners['before'][setter];
      // contatore dei listener che verrà decrementato ad ogni chiamata a next()
      counter = 0;
      // funzione passata come ultimo parametro ai listeners,
      // che ***SE SONO STATI AGGIUNTI COME ASINCRONI la DEVONO*** richiamare per poter proseguire la catena
      function next(bool) {
        // inizializzo la variabile cont a true (continue) non possibile usare
        // continue perchè parola riservata di javascript
        var cont = true;
        // verifica se è stato passato un parametro boolenao alla funzione
        // e la setto alla variabile cont (continue)
        if (_.isBoolean(bool)) {
          cont = bool;
        }
        // ricavo l'array di argomenti passati alla funzione setter
        var _args = Array.prototype.slice.call(args);
        // se la catena è stata bloccata (cont==false)
        // o se siamo arrivati alla fine dei beforelisteners
        // o non non sono stati settati nessun beforelisteners
        if (cont === false || (counter == beforeListeners.length)) {
          if (cont === false) {
            // significa che si è verificato un errore oppure si è forzato a concludere
            abort.apply(self, args);
          } else {
            //vado a chiamare la funzione setter
            completed = complete.apply(self, args);
            //verifico che cosa ritorna
            if (_.isUndefined(completed) || completed === true) {
              self.emitEvent('set:'+setter,args);
            }
          }
        } else {
          // se cont è true (continua)
          if (cont) {
            // vado a prendere la funzione dall'array dei before listener
            var listenerFnc = beforeListeners[counter].fnc;
            // verifico se questa è asyncrona
            if (beforeListeners[counter].async) {
              // aggiungo next come ulyimo nel caso di onbeforeasync
              _args.push(next);
              // vado ad aggiornare il counter dei listener onbefore
              counter += 1;
              // chiamo la funzione passandogli l'argomento (modificato con next)
              // su se stesso
              listenerFnc.apply(self, _args)
            } // nel caso di onbefore(quindi non asincrona)
            else {
              // chiamo la funzione listener che mi deve ritornare un boolenano o undefined
              var _cont = listenerFnc.apply(self,_args);
              //vado ad aggiornare il counter
              counter += 1;
              next(_cont);
            }
          }
        }
      }
      // quando viene chiamato la funzione
      // viene lanciato la funzione next
      next();
      // la nuova funzione (il setter) associato all'ggetto che ne ha dichiarato
      // la presenza ritorneà una promise
      return deferred.promise();
    }
  })
};

// funzione che unregistra la chiave del listener
proto.un = function(listenerKey) {
  _.forEach(this.settersListeners, function(setterListeners) {
      _.forEach(setterListeners,function(listener,idx){
        if (listener.key == listenerKey) {
          setterListeners.splice(idx,1);
        }
      })
  })
};

//metodo get
proto.get = function(key) {
  var value = this[key] && !(this[key] instanceof Function) ? this[key] : null;
  return value;
};

//metodo set
proto.set = function(key, value) {
  this[key] = value;
};

module.exports = G3WObject;
