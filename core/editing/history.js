var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function History() {
  base(this);

  // vengono registrati tutti i layers
  // che sono coinvolti
  /*
  * La struttura sarà
  * layerid: [
  *   {
  *     id: chiaveunivoca
  *     add:[features],
  *     delete:[features],
  *     update:[features]
  *   },
  *   ....
  * ],
  * layerid: [
  *   {
  *     id: chiaveunivoca
  *     add:[features],
  *     delete:[features],
  *     update:[features]
  *   },
  *   ....
  * ],
  * }
  *
  * */
  this.layers = {};
  this.commits = [];
}

inherit(History, G3WObject);

var proto = History.prototype;

proto.addLayer = function(layer) {

};


proto.removeLayer = function(layerId) {
  delete layers[layerId];
};

proto.add = function(layerId, timestamp) {
  if (!this.layers[layerId]) {
    // questo viene previsto nel caso di una relazione
    // che viene sempre modficata dal layer padre e quindi passerà
    // il suo timestamp
    var timestamp = timestamp || Date.now();
    // contiene l'array di tutte degli oggetti di tutte le moedifiche
    // di quel layer (utile a svolgere l'undo/redo)
    this.layers[id] = [{
      id: timestamp,
      add:[],
      delete:[],
      update:[]
    }];
  }
};


proto.undo = function(layerId) {

};

proto.redo = function(layerId) {

};

proto.clear = function(layerId) {

};

proto.clearAll = function() {
  this.layers = {};
  this.commits = [];
};


module.exports = History;