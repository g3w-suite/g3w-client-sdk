var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var FeaturesStore = require('./featuresstore');
var Feature = require('./feature');

// Storage delle features di un layer vettoriale
function OlFeaturesStore(options) {
  base(this, options);
  this._features = new ol.Collection([]);
}

inherit(OlFeaturesStore, FeaturesStore);

proto = OlFeaturesStore.prototype;

proto.getFeatureById = function(featureId) {
  var feat;
  _.forEach(this._features.getArray(), function(feature) {
    if (feature.getId() == featureId) {
      feat = feature;
      return false;
    }
  });
  return feat;
};

//vado ad eseguire in pratica la sostituzione della feature dopo una modifica
proto._updateFeature = function(feature) {
  var self = this;
  _.forEach(this._features.getArray(), function(feat, idx) {
    if (feat.getId() == feature.getId()) {
      self._features.setAt(idx, feature);
      return false;
    }
  });
};

proto._removeFeature = function(feature) {
  var self = this;
  _.forEach(this._features.getArray(), function(feat, idx) {
    if (feature.getId() == feat.getId()) {
      self._features.removeAt(idx);
      return false
    }
  })
};

proto._clearFeatures = function() {
  // vado a rimuovere le feature in modo reattivo (per vue) utlizzando metodi che vue
  // possa reagire allacancellazione di elementi di un array
  this._features.clear();
};

module.exports = OlFeaturesStore;