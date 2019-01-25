const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const FeaturesStore = require('./featuresstore');

// Storage of the feature in vector layer
function OlFeaturesStore(options) {
  base(this, options);
  this._features = new ol.Collection();
}

inherit(OlFeaturesStore, FeaturesStore);

proto = OlFeaturesStore.prototype;

//overwrite
proto.setFeatures = function(features) {
  this._features.clear();
  features.forEach((feature) => {
    this._features.push(feature);
  })
};
// overwrite
proto.readFeatures = function() {
  return this._features.getArray();
};

proto.getFeaturesCollection = function() {
  return this._features;
};

proto.getFeatureById = function(featureId) {
  return this._features.getArray().find((feature) => {
    return feature.getId() === featureId;
  });
};

proto._addFeature = function(feature) {
  this._features.push(feature);
  this._features.dispatchEvent('change')
};

//sobtitute the feature after modify
proto._updateFeature = function(feature) {
  this._features.forEach(function(feat, idx) {
    if (feat.getId() === feature.getId()) {
      this.setAt(idx, feature);
      return false;
    }
  }, this._features);
  this._features.dispatchEvent('change')
};

// remove feature from store
proto._removeFeature = function(feature) {
  this._features.forEach(function(feat, idx) {
    if (feature.getId() === feat.getId()) {
      this.removeAt(idx);
      return false
    }
  }, this._features);
  this._features.dispatchEvent('change')
};

proto._clearFeatures = function() {
  ///remove feature in reactive way
  this._features.clear();
};

module.exports = OlFeaturesStore;
