const resolve = require('core/utils/utils').resolve;
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const Flow = require('./flow');
const WorkflowsStack = require('./workflowsstack');
//Class to manage flow of steps
function Workflow(options) {
  base(this);
  options = options || {};
  // inputs mandatory to work with editing
  this._inputs = options.inputs || null;
  this._context = options.context || null;
  // flow object to control the flow
  this._flow = options.flow || new Flow();
  // all steps of flow
  this._steps = options.steps || [];
  // if is child of another workflow
  this._child = null;
  // stack workflowindex
  this._stackIndex = null;
}

inherit(Workflow, G3WObject);

const proto = Workflow.prototype;

proto.getStackIndex = function() {
  return this._stackIndex;
};

proto.addChild = function(workflow) {
  if (this._child)
    this._child.addChild(workflow);
  else {
    this._child = workflow;
  }
};

proto.removeChild = function() {
  if (this._child) {
    const index = this._child.getStackIndex();
    WorkflowsStack.removeAt(index);
  }

  this._child = null;
};

proto._setInputs = function(inputs) {
 this._inputs = inputs;
};

proto.getInputs = function() {
  return this._inputs;
};

proto.setContext = function(context) {
 this._context = context;
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

proto.getStep = function(index) {
  return this._steps[index];
};

proto.getLastStep = function() {
  const length = this._steps.length;
  if (length) {
    return this._steps[length]
  }
  return null;
};

proto.getRunningStep = function() {
  let runningStep = null;
  this._steps.forEach((step) => {
    if (step.isRunning()) {
      runningStep = step;
    }
  });
  return runningStep;
};

//stop all workflow children
proto._stopChild = function() {
  return this._child ? this._child.stop(): resolve();
};

// start workflow
proto.start = function(options) {
  options = options || {};
  const d = $.Deferred();
  this._inputs = options.inputs;
  this._context = options.context || {};
  //check if are workflow running
  if (WorkflowsStack.getLength() && WorkflowsStack.getLast() != this)
    WorkflowsStack.getLast().addChild(this);
  this._stackIndex = WorkflowsStack.push(this);
  this._flow = options.flow || this._flow;
  this._steps = options.steps || this._steps;
  this._flow.start(this)
    .then((outputs) => {
      // retunr output
      d.resolve(outputs);
    })
    .fail((error) => {
      d.reject(error);
    });
  return d.promise();
};

// stop workflow during flow
proto.stop = function() {
  ////console.log('Workflow stopping .... ');
  const d = $.Deferred();
  // stop child workflow indpendent from father workflow
  this._stopChild()
    // in every case remove child
    .always(() => {
      this.removeChild();
      WorkflowsStack.removeAt(this.getStackIndex());
      // call stop flow
      this._flow.stop() // ritorna una promessa
        .then(() => {
          d.resolve()
        })
        .fail((err) => {
          // mi serve per capire cosa fare
          d.reject(err)
        });
  });
  return d.promise();
};

module.exports = Workflow;
