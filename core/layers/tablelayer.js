var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Layer = require('./layer');
var Editor = require('core/editing/editor');
var FeaturesStore = require('./features/featuresstore');

function TableLayer(config) {
  base(this, config);

  this.type = Layer.LayerTypes.TABLE;

  this._editor = new Editor(this);
  this._featuresStore = new FeaturesStore({
    provider: this.providers.data
  });
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
  console.log('start editing');
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