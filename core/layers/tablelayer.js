var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Layer = require('./layer');
var Editor = require('core/editing/editor');
var FeaturesStore = require('./features/featuresstore');

// Layer di base su cui si possono fare operazioni di editing
function TableLayer(config) {
  // setters
  this.setters = {
    // cancellazione di tutte le features del layer
    clearFeatures: function () {
      this._clearFeatures();
    },
    addFeature: function (feature) {
      this._addFeature(feature);
    },
    deleteFeature: function (feature) {
      this._deleteFeature(feature);
    },
    updateFeature: function (feature) {
      this._updateFeature(feature);
    },
    setFeatures: function (features) {
      this._setFeatures(features);
    },
    // funzione che recupera i dati da qualsisasi fonte (server, wms, etc..)
    // mediante il provider legato al fetauresstore
    getFeatures: function (options) {
      var self = this;
      options = options || {};
      options.geometryType = this.getGeometryType();
      var d = $.Deferred();
      // qui mi ritorna la promessa del setter (G3WOBJECT)
      this._featuresStore.getFeatures(options)
        .then(function (promise) {
          promise.then(function (features) {
            self.emit('getFeatures', features);
            return d.resolve(features);
          }).fail(function (err) {
            return d.reject(err);
          })
        })
        .fail(function (err) {
          d.reject(err);
        });
      return d.promise();
    }
  };
  // vado a chiamare il Layer di base
  base(this, config);

  this.type = Layer.LayerTypes.TABLE;
  // istanzia un editor alla sua creazione
  this._editor = new Editor({
    layer: this
  });
  // viene istanziato un featuresstore e gli viene associato
  // il data provider
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

proto.getFeaturesStore = function() {
  return this._featuresStore;
};

//funzione che va a sostiuire le features al featuresstore del layer
proto._setFeatures = function(features) {
  this._featuresStore.setFeatures(features);
};

proto.addFeatures = function(features) {
  var self = this;
  _.forEach(features, function(feature) {
    self.addFeature(feature);
  });
};


//metodo che ha lo scopo di aggiungere la feature all featuresstore del layer
proto._addFeature = function(feature) {
  this._featuresStore.addFeature(feature);
};

proto._deleteFeature = function(feature) {
  var featureId = feature.getId();
};

proto._updateFeature = function(feature) {

};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};

// funzione che ritorna le dipendenze per quel layer
// relazioni
proto.getDependencies = function() {

};

//funzione che ritorna possibili dipendenze del layer
proto.hasDependencies = function() {
  return false;
}


module.exports = TableLayer;