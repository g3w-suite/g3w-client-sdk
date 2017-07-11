var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Step(options) {
  base(this);

  options = options || {};
  this._inputs = options.inputs || null;
  this._task = options.task || null;
  this._outputs = options.outputs || null;

  this.state = {
    id: options.id || null,
    name: options.name || null,
    help: options.help || null, // help che verrà visualizzato per descrivere a cosa serve
    running: false, // se è in fase di lavorazione
    error: null, // riporta se c'è stato un errore
    message: null // eventuale messaggio da presentare all'utente
  }
}

inherit(Step, G3WObject);

var proto = Step.prototype;

// metodo chiamato per far partire il task
proto.run = function(inputs, context) {
  var d = $.Deferred();
  if (this._task) {
    try {
      // metto lo stato dello step a running
      this.state.running = true;
      this._task.run(inputs, context)
        .then(function(outups) {
          d.resolve(outups);
        })
        .fail(function(err) {
          d.reject(err);
        })
    }
    catch(err) {
      this.state.running = false;
      this.state.error = err;
      d.reject(err);
    }
  }
  return d.promise();
};

// faccio il revert del task
proto.revert = function() {
  if (this._task && this._task.revert){
   this._task.revert();
  }
};

proto.panic = function() {
  if (this._task && this._task.panic){
    this._task.panic();
  }
};

proto.getId = function() {
  return this.state.id;
};

proto.getName = function() {
  return this.state.name;
};

proto.getHelp = function() {
  return this.state.help;
};

proto.getError = function() {
  return this.state.error;
};

proto.getMessage = function() {
  return this.state.message;
};

proto.setInputs = function(inputs) {
  this._inputs = inputs;
};

proto.getInputs = function() {
  return this._inputs;
};

proto.setTask = function(task) {
  this._task = task;
};

proto.getTask = function() {
  return this._task;
};

proto.setOutputs = function(outputs) {
  this._outputs = outputs;
};

proto.getOutputs = function() {
  return this._outputs;
};

module.exports = Step;