var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var GUI = require('gui/gui');
var EditorControlFactory = require('./controlfactory');

function EditingService(options) {

  this._editorsControls = [];

  this.state = {

  }
}

var proto = EditingService.prototype;

proto.stop = function() {
  var self = this;
  var deferred = $.Deferred();
  this._cancelOrSave()
    .then(function() {
      self._stopEditing();
      deferred.resolve();
    })
    .fail(function(){
      deferred.reject();
    })
    .always(function() {
      GUI.closeForm();
    });
  return deferred.promise();
};

proto.getOperations = function() {
  return this._operations;
};

proto.addEditor = function(editor) {
  var editorControl = EditorControlFactory.build(editor);
  this._editorsControls.push(editorControl);
};

proto.getEditorsControls = function() {
  return this._editorsControls;
};

proto._cancelOrSave = function(){
  return resolve();
};

proto._stopEditing = function(){

};

module.exports = EditingService;