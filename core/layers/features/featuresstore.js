var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function FeaturesStore(options) {
  var self = this;
  options = options || {};
  this._features = [];
  this._provider = options.provider || null;
  this.setters = {
    addFeatures: function(features) {
      _.forEach(features, function(feature) {
        self._addFeature(feature);
      })
    },
    addFeature: function(feature) {
      this._addFeature(feature);
    },
    setFeatures: function(features) {
      this._setFeatures(features);
    },
    removeFeature: function(feature) {
      this._removeFeature(feature);
    },
    updateFeature: function(feature) {
      this._updateFeature(feature);
    },
    clear: function() {
      self._clearFeatures();
    },
    getFeatures: function(options) {
      options = options || {};
      var self = this;
      var d = $.Deferred();
      // verifico che ci siano opzioni altrimenti vado a recuperare le
      // features prese
      if (options) {
        this._provider.getFeatures(options)
          .then(function(features) {
            self.addFeatures(features);
            d.resolve(features);
          });
      } else {
        d.resolve(this._features);
      }
      return d.promise();
    }
  };

  base(this);
}

inherit(FeaturesStore, G3WObject);

proto = FeaturesStore.prototype;

proto.getFeatureById = function(featureId) {
  var feat;
  _.forEach(this._features, function(feature) {
    if (feature.getId() == featureId) {
      feat = feature;
      return false;
    }
  });
  return feat;
};

proto._addFeature = function(feature) {
  this._features.push(feature);
};

//vado ad eseguire in pratica la sostituzione della feature dopo una modifica
proto._updateFeature = function(feature) {
  var self = this;
  _.forEach(this._features, function(feat, idx) {
    if (feat.getId() == feature.getId()) {
      self._features[idx] = feature;
      return false;
    }
  });
};

proto._setFeatures = function(features) {
  if (_.isArray(features)) {
    this._features = features;
  }
};

proto._removeFeature = function(feature) {
  var self = this;
  _.forEach(this._features, function(feat, idx) {
    if (feature.getId() == feat.getId()) {
      self._features.splice(idx, 1);
      return false
    }
  })
};

proto._clearFeatures = function() {
  // vado a rimuovere le feature in modo reattivo (per vue) utlizzando metodi che vue
  // possa reagire allacancellazione di elementi di un array
  this._features.splice(0, this._features.length);
};

proto.getDataProvider = function() {
  return this._dataprovider;
};

module.exports = FeaturesStore;