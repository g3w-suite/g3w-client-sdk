var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Worflow(){
  base(this);

  this._inputs = null;
  this._context = null;
  this._steps = [];
}
inherit(Worflow, G3WObject);

var proto = Worflow.prototype;

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

proto.start = function(inputs, context) {
  var d = $.Deferred();
  this._inputs = inputs;
  this._context = context;
  var flow = new Worflow.Flow();
  flow.start(workflow).
    then(function(outputs) {
      d.resolve(outputs);
    }).
    fail(function(error){
      d.reject(error);
    })
};

Worflow.Flow = function() {
  var self = this;
  var d = $.Deferred();
  var steps = [];
  var counter = 0;
  var context = null;
  var onDone = null;
  var onError = null;

  this.start = function(workflow, ondone, onerror) {
    if (counter > 0) {
      console.log("reset workflow before restarting");
      onerror('workflow not reset');
    }
    var inputs = workflow.getInputs();
    context = workflow.getContext();
    steps = this._workflow.getSteps();
    if (steps) {
      this.runStep(steps[0], inputs);
    }
  };

  this.runStep = function(step, inputs) {
    step.run(inputs, context, _.bind(this.onDone, this), _.bind(this.onError, this));
  };

  this.onDone = function(outputs) {
    if (counter == steps.length) {
      d.resolve(outputs);
      return;
    }
    counter++;
    this.runStep(steps[counter], outputs);
  };

  this.onError = function(error) {
    console.log('step error');
    d.reject(error);
  };
}

module.exports = Worflow;