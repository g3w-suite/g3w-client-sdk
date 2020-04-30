const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const Queque = require('./queque')

//Class Flow of workflow step by step
function Flow() {
  let steps = [];
  let inputs;
  let counter = 0;
  let context = null;
  let d;
  let _workflow;
  this.queques = {
    end: new Queque(),
    micro: new Queque()
  };
  //start workflow
  this.start = function(workflow) {
    d = $.Deferred();
    if (counter > 0) {
      console.log("reset workflow before restarting");
    }
    _workflow = workflow;
    inputs = workflow.getInputs();
    context = workflow.getContext();
    steps = workflow.getSteps();
    // check if there are steps
    if (steps && steps.length) {
      //run step (first)
      this.runStep(steps[0], inputs, context);
    }
    // return a promise that will be reolved if all step go right
    return d.promise();
  };

  //run step
  this.runStep = function(step, inputs) {
    //run step that run task
    _workflow.setMessages({
      help: step.state.help
    });
    const runTasks = this.queques.micro.getLength();
    step.run(inputs, context, this.queques)
      .then((outputs) => {
        this.onDone(outputs);
        runTasks && this.queques.micro.run();
      })
      .fail((error) => {
        this.clearQueques();
        this.onError(error);
      })
  };

  //check if all step are resolved
  this.onDone = function(outputs) {
    counter++;
    if (counter === steps.length) {
      counter = 0;
      this.clearQueques();
      d.resolve(outputs);
      return;
    }
    this.runStep(steps[counter], outputs);
  };

  // in case of error
  this.onError = function(err) {
    counter = 0;

    d.reject(err);
  };

  // stop flow
  this.stop = function() {
    const d = $.Deferred();
    //vcheck the counter
    steps[counter].isRunning() ? steps[counter].stop() : null;
    if (counter > 0) {
      // set counter to 0
      counter = 0;
      // reject flow
      d.reject();
    } else {
      //reject to force rollback session
      d.resolve();
    }
    this.clearQueques();
    return d.promise();
  };
  base(this)
}

inherit(Flow, G3WObject);

const proto = Flow.prototype;

proto.clearQueques = function(){
  this.queques.micro.clear();
  this.runEndQueque();
};

proto.runEndQueque = function(){
  this.queques.end.run();
  this.queques.end.clear();
};

module.exports = Flow;

