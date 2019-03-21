const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const FeaturesStore = require('./featuresstore');

// Storage of the feature in vector layer
function OlFeaturesStore(options={}) {
  base(this, options);
  this._features = new ol.Collection();
}

inherit(OlFeaturesStore, FeaturesStore);

proto = OlFeaturesStore.prototype;

proto.getLength = function() {
  return this._features.getLength();
};

//overwrite
proto.setFeatures = function(features=[]) {
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
  // set index at -1
  let index = -1;
  const featuresArray = this._features.getArray();
  for (let i = 0; featuresArray.length; i++) {
    const _feature = featuresArray[i];
    if(_feature.getId() === feature.getId()) {
      index = i;
      break;
    }
  }
  if (index >=0) {
    this._features.removeAt(index);
    this._features.insertAt(index, feature);
    this._features.dispatchEvent('change')
  }
};

// remove feature from store
proto._removeFeature = function(feature) {
  this._features.forEach((feat, idx) => {
    if (feature.getId() === feat.getId()) {
      this._features.removeAt(idx);
      return false
    }
  });
  this._features.dispatchEvent('change')
};

proto._clearFeatures = function() {
  this._features.clear({
    fast: true
  });
  // needed if we use Modify or snap interaction in ol to remove listerner on add or remove event on collection
  this._features = null;
  this._features = new ol.Collection();
};

module.exports = OlFeaturesStore;
