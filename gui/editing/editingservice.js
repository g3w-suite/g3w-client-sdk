var resolve = require('core/utils/utils').resolve;
var reject = require('core/utils/utils').reject;
var GUI = require('gui/gui');

function EditingService(options) {}

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

proto._cancelOrSave = function(){
  return resolve();
};

proto._stopEditing = function(){

};

module.exports = EditingService;