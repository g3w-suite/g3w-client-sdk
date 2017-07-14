var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Flow = require('./flow');

//classe che ha lo scopo generico di gestire un flusso
// ordinato di passi (steps)
function Workflow() {
  base(this);

  this._inputs = null;
  //oggetto che determina il contesto in cui
  // opera il workflow
  this._context = null;
  // flow oggetto che mi permette di stabilile come
  // mi devo muovere all'interno del worflow
  this._flow = null;
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

proto.getFlow = function() {
  return this._flow;
};

proto.setFlow = function(flow) {
  this._flow = flow;
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

// metodo principale al lancio del workflow
proto.start = function(options) {
  options = options || {};
  var d = $.Deferred();
  this._inputs = options.inputs;
  //oggetto che mi server per operare su
  // elementi utili
  this._context = options.context;
  this._flow = options.flow || new Flow();
  this._steps = options.steps || this._steps;
  this._flow.start(this). //ritorna una promessa
    then(function(outputs) {
      d.resolve(outputs);
    }).
    fail(function(error){
      d.reject(error);
    });
  return d.promise();
};

// metodo stop utilizzato per eventualmente stoppare
// il workflow durante il suo flusso
proto.stop = function() {

};

module.exports = Workflow;