var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

//classe che permette di attivare il flusso del workflow
// passando trai i vari steps
function Flow() {
  var self = this;
  var d = $.Deferred();
  var steps = [];
  var counter = 0;
  var context = null;

  this.start = function(workflow) {
    if (counter > 0) {
      console.log("reset workflow before restarting");
      onerror('workflow not reset');
    }
    var inputs = workflow.getInputs();
    context = workflow.getContext();
    steps = workflow.getSteps();
    // verifico che ci siano steps
    if (steps && steps.length) {
      // faccio partire il primo step
      //passando gli inputs assegannti al worflow
      this.runStep(steps[0], inputs);
    }
    // ritono la promessa che verrà risolta solo
    // se tutti gli steps vanno a buon fine
    return d.promise();
  };

  //funzione che fa il rloun dello step
  this.runStep = function(step, inputs) {
    step.run(inputs, context)
      .then(function(outputs) {
        self.onDone(outputs);
      })
      .fail(function(error) {
        self.onError(error);
      });
  };

  //funzione che verifica se siamo arrivati alla fine degli steps
  // se si risolve
  this.onDone = function(outputs) {
    if (counter == steps.length) {
      console.log('sono arrivato in fondo agli steps senza errori');
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

  base(this)
}

inherit(Flow, G3WObject);

module.exports = Flow;

