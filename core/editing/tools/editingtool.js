var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

// CLASSE PADRE DI TUTTI GLI EDITING TOOL
function EditingTool(editor, options) {
  // interactions
  this._interactions = [];
  // editor padre
  this.editor = editor;
  // il layer originale su cui si fa l'editing
  this.layer = this.editor.getVectorLayer().getMapLayer();
  // il layer di editing
  this.editingLayer = this.editor.getEditVectorLayer().getMapLayer();
  // eventuali opzioni
  this.options = options || {};
  this.steps = null;
  base(this);
}

inherit(EditingTool, G3WObject);

var proto = EditingTool.prototype;
// metodo per aggiungere un'interazione
proto.addInteraction = function(interaction) {
  // recupero il mapservice
  var mapService = this.editor.getMapService();
  mapService.addInteraction(interaction);
  this._interactions.push(interaction);
};
// rimuovo un'interazione
proto.removeInteraction = function(interaction) {
  var _interactions = this._interactions;
  var mapService = this.editor.getMapService();
  _.forEach(_interactions,function(_interaction,idx) {
    if (_interaction == interaction) {
      _interactions.splice(idx,1);
    }
  });
  //vado a rimuove l'interaction e quindi tutte le feture che sono appese
  mapService.removeInteraction(interaction);
};

proto.ownsInteraction = function(interaction) {
  var owns = false;
  _.forEach(this._interactions, function(_interaction) {
    if (_interaction == interaction) {
      owns = true;
    }
  });
  return owns;
};
// metodo di fine editing
proto.stop = function() {
  if (this.steps) {
    this.steps.destroy();
  }
  return true;
};

// metodo che deve essere sovrascritto dalle
// sottoclassi
proto.run = function() {
  console.log('Se appare quasto messaggio significa che non è stato sovrascritto il metodo run() dalla sottoclasse');
};

// classe costruttore dell'istanza steps
EditingTool.Steps = function(steps) {
  // metto a -1 in quanto la prima cosa che faccio è
  // e di fare next() per vedere la prima zione che devo fare
  // quindi individuare il primo elemento dell'array steps
  var index = -1;
  //ARRAY
  var steps = steps;
  this.next = function() {
    index += 1;
    var step = steps[index];
    // emetto evento step
    this.emit('step', index, step);
  };
  
  this.currentStep = function() {
    return steps[index];
  };
  
  this.currentStepIndex = function(){
    return index;
  };
  
  this.totalSteps = function(){
    return steps.length;
  };
  
  this.reset = function(){
    index = 0;
  };
  
  this.destroy = function(){
    this.removeAllListeners();
  };
  
  this.completed = function() {
    // emetto l'evento complete
    this.emit('complete');
    // resetto porto a 0 il valore dell'index
    this.reset();
  };
  // funzione che inserisce qualcosa da fare ad un prciso momento (indice) dell'array
  this.insertStepAt = function(idx,step){
    steps.splice(idx,0,step);
  }
};

inherit(EditingTool.Steps,G3WObject);

module.exports = EditingTool;
