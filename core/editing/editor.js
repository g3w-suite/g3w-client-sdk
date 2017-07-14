var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// classe Editor
function Editor(options) {
  options = options || {};
  base(this);
  //deve far riferimento necessariamente ad un layer
  this._layer = options.layer;
  // attributo che mi dice se l'editor è attivo o no
  this._started = false;
}

inherit(Editor, G3WObject);

var proto = Editor.prototype;

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
  return this._layer;
};

//funzione che fa partire lo start editing
proto.start = function() {
  var d = $.Deferred();
  // carica le features del layer
  this._layer.getFeatures()
    .then(function(features) {
      // le features ono già dentro il featuresstore del layer
      d.resolve(features);
      // se andato tutto bene setto a true la proprietà started
      self._started = true;
    })
    .fail(function(err) {
      d.reject(err);
    });

  return d.promise()
};


proto.stop = function() {
  this._started = false;
};

proto.isStarted = function() {
  return this._started;
};


module.exports = Editor;