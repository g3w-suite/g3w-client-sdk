var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// classe Editor
function Editor(options) {
  options = options || {};
  base(this);
  //deve far riferimento necessariamente aud un layer
  this._layer = options.layer;
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
  this._layer.getFeatures()
    .then(function(features) {
      //TODO
    })
};

module.exports = Editor;