var resolve = require('core/utils/utils').resolve;
var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Flow = require('./flow');
var WorkflowsStack = require('./workflowsstack');
//classe che ha lo scopo generico di gestire un flusso
// ordinato di passi (steps)
function Workflow(options) {
  base(this);
  options = options || {};
  // oggetto che conterrà tutti
  // i dati necessari a lavorare con l'editing
  this._inputs = options.inputs || null;
  //oggetto che determina il contesto in cui
  // opera il workflow
  this._context = options.context || null;
  // flow oggetto che mi permette di stabilile come
  // mi devo muovere all'interno del worflow
  this._flow = options.flow || new Flow();
  // sono i vari passi con i relativi task
  // nei quali l'inpust verranno aggiornati
  this._steps = options.steps || [];
  // qui viene messo il child del workflow
  this._child = null;
  // indice dello stack dei workflow
  this._stackIndex = null;
}

inherit(Workflow, G3WObject);

var proto = Workflow.prototype;

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
    var index = this._child.getStackIndex();
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
  var length = this._steps.length;
  if (length) {
    return this._steps[length]
  }
  return null;
};

proto.getRunningStep = function() {
  var runningStep = null;
  _.forEach(this._steps, function(step) {
    if (step.isRunning()) {
      runningStep = step;
    }
  });
  return runningStep;
};

//funzione cha va a stoppare tutti i figli del worflow
proto._stopChild = function() {
  return this._child ? this._child.stop(): resolve();
};

// metodo principale al lancio del workflow
proto.start = function(options) {
  options = options || {};
  var d = $.Deferred();
  this._inputs = options.inputs;
  //oggetto che mi server per operare su elementi utili
  this._context = options.context || {};
  // verifico se ci sono workflow già presenti in corso
  if (WorkflowsStack.getLength() && WorkflowsStack.getLast() != this)
    WorkflowsStack.getLast().addChild(this);
  this._stackIndex = WorkflowsStack.push(this);
  this._flow = options.flow || this._flow;
  this._steps = options.steps || this._steps;
  this._flow.start(this)
    .then(function(outputs) {
      // ritorna l'outputs
      d.resolve(outputs);
    })
    .fail(function(error) {
      d.reject(error);
    });
  return d.promise();
};

// metodo stop utilizzato per eventualmente stoppare
// il workflow durante il suo flusso
proto.stop = function() {
  var self = this;
  ////console.log('Workflow stopping .... ');
  var d = $.Deferred();
  // chiamo lo stop del child workflow che arà una sua vita  indipendente dal padre
  this._stopChild()
    // in ogni caso faccio il removechild
    .always(function() {
      self.removeChild();
      WorkflowsStack.removeAt(self.getStackIndex());
      // vado a chiamare lo stop del flow
      self._flow.stop() // ritorna una promessa
        .then(function() {
          d.resolve()
        })
        .fail(function(err) {
          // mi serve per capire cosa fare
          d.reject(err)
        });
  });
  return d.promise();
};

module.exports = Workflow;