var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Flow = require('./flow');

//classe che ha lo scopo generico di gestire un flusso
// ordinato di passi (steps)
function Workflow() {
  base(this);

  this._inputs = null;
  this._context = null;
  this._steps = [];
}

inherit(Workflow, G3WObject);

var proto = Workflow.prototype;

proto.getInputs = function() {
  return this._inputs;
};

proto.getContext = function() {
  return this._context;
};

proto.addStep = function(step) {
  this._steps.push(step);
};

proto.setSteps = function(steps) {
  this._steps = steps;
};

proto.getSteps = function() {
  return this._steps;
};

proto.getSteps = function(index) {
  return this._steps[index];
};

proto.getLastStep = function() {
  var length = this._steps.length;
  if (length) {
    return this._steps[length]
  }
  return null;
};

// metodo che permette di avviare il workflow
proto.start = function(inputs, context, flow) {
  var d = $.Deferred();
  this._inputs = inputs;
  this._context = context;
  var flow = flow || Flow();
  flow.start(this). //ritorna una promessa
    then(function(outputs) {
      d.resolve(outputs);
    }).
    fail(function(error){
      d.reject(error);
    })
};

module.exports = Workflow;