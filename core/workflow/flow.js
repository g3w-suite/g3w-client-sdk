var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

//classe che permette di attivare il flusso del workflow
// passando trai i vari steps
function Flow() {
  var self = this;
  var d = $.Deferred();
  var steps = [];
  var inputs;
  var counter = 0;
  var context = null;
  

  this.start = function(workflow) {
    if (counter > 0) {
      console.log("reset workflow before restarting");
      onerror('workflow not reset');
    }
    //prendo gli inputs passati al workflow
    inputs = workflow.getInputs();
    // prendo il contex su cui agisce il workflow
    context = workflow.getContext();
    //recupero gli steps che il workflow deve fare
    steps = workflow.getSteps();
    // verifico che ci siano steps
    if (steps && steps.length) {
      // faccio partire il primo step
      //passando gli inputs assegannti al worflow
      this.runStep(steps[0], inputs, context);
    }
    // ritono la promessa che verrà risolta solo
    // se tutti gli steps vanno a buon fine
    return d.promise();
  };

  //funzione che fa il rloun dello step
  this.runStep = function(step, inputs, context) {
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
    //vado ad aumentare di uno il counter degli steps andati a buon fine e verifico
    // se sono arrivato alla fine degli steps oppure no
    counter++;
    if (counter == steps.length) {
      console.log('sono arrivato in fondo agli steps senza errori');
      d.resolve(outputs);
      return;
    }
    this.runStep(steps[counter], outputs);
  };

  this.onError = function(error) {
    console.log('step error');
    d.reject(error);
  };

  this.stop = function() {
    var d = $.Deferred();
    console.log('stop flow ...');
    d.resolve(true);
    return d.promise();
  };

  base(this)
}

inherit(Flow, G3WObject);

module.exports = Flow;

