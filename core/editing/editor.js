var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Editor(layer){
  base(this);

  this._layer = layer;
}
inherit(Editor, G3WObject);

var proto = Editor.prototype;

module.exports = Editor;