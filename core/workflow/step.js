var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Step(options){
  base(this);

  options = options || {};
  this._inputs = options.inputs || null;
  this._task = options.task || null;
  this._outputs = options.outputs || null;

  this.state = {
    id: options.id || null,
    name: options.name || null,
    help: options.help || null,
    running: false,
    error: null,
    message: null
  }
}
inherit(Step, G3WObject);

var proto = Step.prototype;

proto.run = function(inputs, context) {
  if (this._task) {
    try {
      this._task.run(inputs, context);
      this.state.running = true;
    }
    catch(err) {
      this.state.running = false;
      this.state.error = err;
    }
  }
};

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