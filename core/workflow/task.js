var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Task(options) {
  base(this, options);
  // eventuali attributi reattivi sul task
  this.state = {};
}

inherit(Task, G3WObject);

var proto = Task.prototype;

// funzione che ha il compito di fare un (undo)
// di quello che il task ha fatto 
proto.revert = function() {
  console.log('Revert da implementare ');
};

// punzione che viene chiamata se qualcosa va storto
// errore nel completare un task
proto.panic = function() {
  console.log('Panic da Implementare ..');
};

// funzione adibita allo stop del task che avrà lo scopo verosimilmente
// di fare un clean di tutti gli oggetti che sono serviti o che servono
// a portare aanti quel determinato task
proto.stop = function() {
  console.log('Task Stop da imlementare ..');
};

// funzione base che devere essere sovrascritta dal task
// per par partire l'editing
proto.run = function() {
  console.log('Se appare quasto messaggio significa che non è stato sovrascritto il metodo run() dalla sottoclasse');
};

proto.setRoot = function(task) {
  this.state.root = task;
};



module.exports = Task;