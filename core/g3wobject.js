const inherit = require('core/utils/utils').inherit;
const noop = require('core/utils/utils').noop;
const debounce = require('core/utils/utils').debounce;
const throttle = require('core/utils/utils').throttle;

/**
 * Base object to handle a setter and its listeners.
 * @constructor
 */

const G3WObject = function() {
  //check if setters property is set. Register the chain of events
  if (this.setters) {
    this._setupListenersChain(this.setters)
  }
  // check debounces
  if (this.debounces) {
    this._setupDebounces(this.debounces)
  }
  //check throttles
  if (this.throttles) {
    this._setupThrottles(this.throttles)
  }
};

inherit(G3WObject, EventEmitter);

const proto = G3WObject.prototype;

/**
 * Insert a listener on afeter setter was executed
 * @param {string} setter - IMethod name to register a listener function
 * @param {function} listener - listener function (only syncron)
 * @param {number} priority - Priorità di esecuzione: valore minore viene eseuito prima
 */
proto.onafter = function(setter, listener, priority){
  return this._onsetter('after', setter, listener, false, priority);
};

proto.onceafter = function(setter, listener, priority){
  return this._onsetter('after', setter, listener, false, priority, true);
};

/**
 * Listern before cal sesster
 * @param {string} setter - Method name setter
 * @param {function} listener - function to call
 * @param {number} priority - Priority
 */
proto.onbefore = function(setter, listener, priority) {
  return this._onsetter('before', setter, listener, false, priority);
};

// once before
proto.oncebefore = function(setter, listener, priority){
  return this._onsetter('before', setter, listener, false, priority, true);
};

/**
 * @param {string} setter - Method name setter
 * @param {function} listener - function to call
 * @param {number} priority - Priority
 */
proto.onbeforeasync = function(setter, listener, priority) {
  return this._onsetter('before', setter, listener, true, priority);
};

proto.un = function(setter, key) {
  Object.entries(this.settersListeners).forEach(([_key, settersListeners]) => {
    settersListeners[setter].forEach((setterListener, idx) => {
      if (setterListener.key === key) {
        settersListeners[setter].splice(idx, 1);
      }
    })
  });
};

// base function to handle onafter or before listeners
/*
  when=before|after,
  type=sync|async
*/
proto._onsetter = function(when, setter, listener, async, priority=0, once=false) {
  const settersListeners = this.settersListeners[when];
  const listenerKey = `${Math.floor(Math.random()*1000000) + Date.now()}`;
  const settersListeneres = settersListeners[setter];
  settersListeneres.push({
    key: listenerKey,
    fnc: listener,
    async,
    priority,
    once
  });
  // reader array based on priority
  settersListeners[setter] = _.sortBy(settersListeneres, function(setterListener) {
    return setterListener.priority;
  });
  // return key
  return listenerKey;
};

proto._setupListenersChain = function(setters) {
  // initialize all methods inside object "setters" of child class.
  this.settersListeners = {
    after: {},
    before: {}
  };
  for (const setter in setters) {
    const setterOption = setters[setter];
    let setterFnc = noop;
    let setterFallback = noop;
    if (_.isFunction(setterOption))
      setterFnc = setterOption
    else {
      setterFnc = setterOption.fnc;
      setterFallback = setterOption.fallback || noop; // method called in case of error
    }
    // create array to push before and after subscribers
    this.settersListeners.after[setter] = [];
    this.settersListeners.before[setter] = [];
    // assign the property settern name to the object as own method
    this[setter] = function(...args) {
      const deferred = $.Deferred();
      let returnVal = null;
      let counter = 0;
      // function to call original function(setter function)
      const callSetter = () => {
        // run setter function
        returnVal = setterFnc.apply(this, args);
        // resolve promise
        deferred.resolve(returnVal);
        //call all subscribed methods afet setter
        const onceListeners = [];
        const afterListeners = this.settersListeners.after[setter];
        afterListeners.forEach((listener, index) => {
          listener.once && onceListeners.push(index);
          listener.fnc.apply(this, args);
        });
        onceListeners.forEach((index) => {
          this.settersListeners.after[setter].splice(index, 1);
        })
      };
      //  abort function
      const abort = () => {
        setterFallback.apply(this, args);
        deferred.reject();
      };
      // get all before listeners functions of setter
      const beforeListeners = this.settersListeners['before'][setter];
      // listener counter
      counter = 0;
      const next = (bool) => {
        // initilize cont to true (continue)
        let cont = true;
        // check if bool is Boolean
        if (_.isBoolean(bool)) {
          cont = bool;
        }
        // check if count is false or we are arrived to the end of onbefore subscriber
        if (cont === false) {
            // found an error so we can abort
            abort.apply(this, args);
        } else if (counter === beforeListeners.length) {
          // call complete method methods
          const completed = callSetter();
          //verifico che cosa ritorna
          if (completed === undefined || completed === true) {
            this.emitEvent(`set:${setter}`,args);
          }
        } else if (cont) {
          const listenerObj = beforeListeners[counter];
          const currentCounter = counter;
          // if is async functtion
          if (beforeListeners[counter].async) {
            //add function next to argument of listnerFunction
            args.push(next);
            // update counter
            counter += 1;
            listenerObj.fnc.apply(this, args)
          } else {
            // return or undefine or a boolen to tell if ok(true) can conitnue or not (false)
            const bool = listenerObj.fnc.apply(this, args);
            //update counter
            counter += 1;
            next(bool);
          }
          listenerObj.once && beforeListeners.splice(currentCounter, 1);
        }
      };
      // run next to start to run all the subscribers and setrer its self
      next();
      // retun a promise
      return deferred.promise();
    }
  }
  return this.settersListeners
};

proto._setupDebounces = function(debounces) {
  for (const name in debounces) {
    const delay = debounces[name].delay;
    const fnc = debounces[name].fnc;
    this[name] = debounce(fnc, delay);
  }
};

proto._setupThrottles = function(throttles) {
  for (const name in throttles) {
    const delay = throttles[name].delay;
    const fnc = throttles[name].fnc;
    this[name] = throttle(fnc, delay);
  }
};

//method get
proto.get = function(key) {
  return this[key] && !(this[key] instanceof Function) ? this[key] : null;
};

//method set
proto.set = function(key, value) {
  this[key] = value;
};

module.exports = G3WObject;
