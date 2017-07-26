var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Session = require('./session');

// classe Editor che ha lo scopo di comunicare con il layer e
// di svolgere azioni primarie
function Editor(options) {
  options = options || {};
  this.setters = {
    save: function() {
      this._save();
    },
    addFeature: function(feature) {
      this._addFeature(feature);
    },
    updateFeature: function(feature) {
      this._updateFeature(feature);
    },
    deleteFeature: function(feature) {
      this._deleteFeature(feature);
    },
    setFeatures: function(features) {
      this._setFeatures(features);
    },
    getFeatures: function (options) {
      var d = $.Deferred();
      this._layer.getFeatures(options)
        .then(function (promise) {
          promise.then(function (features) {
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
proto.start = function(options) {
  var self = this;
  var d = $.Deferred();
  // carica le features del layer in base al tipo di filtro (da vedere come)
  this.getFeatures(options)
    .then(function(promise) {
      promise
        .then(function(features) {
          // le features ono già dentro il featuresstore del layer
          d.resolve(features);
          // se andato tutto bene setto a true la proprietà
          self._started = true;
        })
        .fail(function(err) {
          d.reject(err);
        })

    })
    .fail(function(err) {
      d.reject(err);
    });
  return d.promise()
};


//qui sono le azioni che agiscono direttamente sul layer

proto._addFeature = function(feature) {
  this._layer.addFeature(feature);
};

proto._deleteFeature = function(feature) {
  this._layer.deleteFeature(feature);
};

proto._updateFeature = function(feature) {
  this._layer.updateFeature(feature);
};

proto._setFeatures = function(features) {
  this._layer.setFeatures(features);
};

// stop editor
proto.stop = function() {
  this._started = false;
};

//metodo save che non fa altro che lanciare il save del layer
proto._save = function() {
  this._layer.save();
};

proto.isStarted = function() {
  return this._started;
};

// funzione che viene lanciata dopo che è stato salvato
// il nuono stato del layer definitivamente sul server
proto.commit = function() {
};

module.exports = Editor;