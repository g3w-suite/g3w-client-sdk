const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

// class Editor bind editor to layer to do main actions
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
      return this._getFeatures(options);
    }
  };
  base(this);
  // referred layer
  this._layer = options.layer;
  // editor is active or not
  this._started = false;
}

inherit(Editor, G3WObject);

const proto = Editor.prototype;

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
  return this._layer;
};

// fget features methods
proto._getFeatures = function(options) {
  const d = $.Deferred();
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
};

// run after server apply chaged to origin resource
proto.commit = function(commitItems, featurestore) {
  const d = $.Deferred();
  this._layer.commit(commitItems, featurestore)
    .then((promise) => {
      promise
        .then((response) => {
          // update features after new insert
          return d.resolve(response);
        })
        .fail((err) => {
        return d.reject(err);
      })
    })
    .fail((err) => {
      d.reject(err);
    });
  return d.promise();
};

//start editing function
proto.start = function(options) {
  const d = $.Deferred();
  // load features of layer based on filter type
  this.getFeatures(options)
    .then((promise) => {
      promise
        .then((features) => {
          // the features are already inside featuresstore
          d.resolve(features);
          //if all ok set to started
          this._started = true;
        })
        .fail((err) => {
          d.reject(err);
        })

    })
    .fail((err) => {
      d.reject(err);
    });
  return d.promise()
};

//action to layer

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
  const d = $.Deferred();
  this._layer.unlock()
    .then((response) => {
      this._started = false;
      d.resolve(response);
    })
    .fail((err) => {
      d.reject(err);
    });
  return d.promise();
};

//run save layer
proto._save = function() {
  this._layer.save();
};

proto.isStarted = function() {
  return this._started;
};

proto.clear = function() {
  this._layer.getFeaturesStore().clear();
};


module.exports = Editor;
