var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

var EditingService = require('./editingservice');

function EditingControl(editor) {
  base(this);
  
  // editor del Layer
  this._editor = options.editor;
  this._tools = options.tools;

  this.state = {
    loading: false,
    enabled: false,
    editing: {
      on: false,
      dirty: false
    }
  }
}
inherit(EditingControl, G3WObject);

var proto = EditingControl.prototype;

module.exports = EditingControl;
