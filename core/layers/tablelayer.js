var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Layer = require('./layer');

function TableLayer(config) {
  base(this, config);

  this.config.type = Layer.LayerTypes.TABLE;

  this._editor = null;
  this._featuresStore = null;
}
inherit(TableLayer, Layer);

var proto = TableLayer.prototype;

proto.getEditor = function() {
  return this._editor;
};

proto.setEditor = function(editor) {
  this._editor = editor;
};

proto._startEditing = function() {
  if (!this._editingLayer) {
    console.log("Call startEditing() on the layer returned by getEditingLayer()");
    return;
  }
  if (this._editingLayer != this) {
    console.log("This layer is a proxy for the true editing layer. Cass startEditing() on it.");
    return;
  }
  console.log('start Editing');
  //this.editor.start();
};

proto._stopEditing = function() {
  console.log('stop editing');
  // this.editor.stop()
};

proto.getFeaturesStore = function() {
  return this._featuresStore;
};

// funzione per la lettura dei dati precedentemente acquisiti dal provider
proto.readFeatures = function() {
  return this._featuresStore.readFeatures();
};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};

// funzione che recupera i dati da qualsisasi fonte (server, wms, etc..)
proto.getFeatures = function(options) {
  var self = this;
  var d = $.Deferred();
  this._featuresStore.getFeatures(options)
    .then(function(features) {
      return d.resolve(features);
    });
  return d.promise();
};


module.exports = TableLayer;