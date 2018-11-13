const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

//Class Flow of workflow step by step
function Flow() {
  let steps = [];
  let inputs;
  let counter = 0;
  let context = null;
  let d;
  let _workflow;
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
    step.run(inputs, context)
      .then((outputs) => {
        this.onDone(outputs);
      })
      .fail((error) => {
        this.onError(error);
      });
  };

  //check if all step are resolved
  this.onDone = function(outputs) {
    counter++;
    if (counter == steps.length) {
      counter = 0;
      d.resolve(outputs);
      return;
    }
    this.runStep(steps[counter], outputs);
  };

  // in case of error
  this.onError = function(err) {
    // error step
    console.log('step error: ', err);
    // reset counter to 0
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
    return d.promise();
  };

  base(this)
}

inherit(Flow, G3WObject);

module.exports = Flow;

