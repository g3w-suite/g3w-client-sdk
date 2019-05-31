const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

// Object to store and handle features of layer
function FeaturesStore(options={}) {
  this._features = options.features || [];
  this._provider = options.provider || null;
  this._loadedPks = []; // store loeckedids
  this._lockIds = []; // store locked features
  this.setters = {
    addFeatures: function(features) {
      features.forEach((feature) => {
        this._addFeature(feature);
      })
    },
    addFeature: function(feature) {
      this._addFeature(feature);
    },
    removeFeature: function(feature) {
      this._removeFeature(feature);
    },
    updateFeature: function(feature) {
      this._updateFeature(feature);
    },
    clear: function() {
      this._clearFeatures();
      this._lockIds = [];
      this._loadedPks = [];
    },
    getFeatures: function(options={}) {
      return this._getFeatures(options);
    },
    commit: function(commitItems, featurestore) {
      return this._commit(commitItems, featurestore);
    }
  };

  base(this);
}

inherit(FeaturesStore, G3WObject);

const proto = FeaturesStore.prototype;

proto.clone = function() {
  return _.cloneDeep(this);
};

proto.setProvider = function(provider) {
  this._provider = provider;
};

proto.getProvider = function() {
  return this._provider;
};

// method unlock features
proto.unlock = function() {
  return this._provider.unlock();
};

// method get all features from server or attribute _features
proto._getFeatures = function(options) {
  const d = $.Deferred();
  if (this._provider && options) {
    this._provider.getFeatures(options)
      .then((options) => {
        const features = this._filterFeaturesResponse(options);
        this.addFeatures(features);
        d.resolve(features);
      })
      .fail((err) => {
        d.reject(err)
      })
  } else {
    d.resolve(this._readFeatures());
  }
  return d.promise();
};

//filter features to add
proto._filterFeaturesResponse = function(options={}) {
  let added = false;
  const features = options.features || [];
  const featurelocks = options.featurelocks || [];
  const featuresToAdd = features.filter((feature) => {
    const featureId = feature.getId();
    added = this._loadedPks.find((pkId) =>{
      return pkId === featureId
    });
    if (!added)
      this._loadedPks.push(featureId);
    return !added
  });
  this._filterLockIds(featurelocks);
  return featuresToAdd;
};

// method cget fetaures locked
proto._filterLockIds = function(featurelocks) {
  const toAddLockId = _.differenceBy(featurelocks, this._lockIds, 'featureid');
  this._lockIds = _.union(this._lockIds, toAddLockId);
};

proto.getLockIds = function() {
  return this._lockIds;
};

//method to add new lockid
proto.addLockIds = function(lockIds) {
  this._lockIds = _.union(this._lockIds, lockIds);
};

proto._readFeatures = function() {
  return this._features;
};

proto._commit = function(commitItems) {
  const d = $.Deferred();
  if (commitItems && this._provider) {
    commitItems.lockids = this._lockIds;
    this._provider.commit(commitItems)
      .then((response) => {
        d.resolve(response);
      })
      .fail((err) => {
        d.reject(err);
      })
  } else {
    d.reject();
  }
  return d.promise();
};

// get feature from id
proto.getFeatureById = function(featureId) {
  let feat;
  this._features.find((feature) => {
    if (feature.getId() === featureId) {
      feat = feature;
      return true;
    }
  });
  return feat;
};

proto._addFeature = function(feature) {
  this._features.push(feature);
};

//substitute feature after update
proto._updateFeature = function(feature) {
  this._features.find((feat, idx) => {
    if (feat.getId() === feature.getId()) {
      this._features[idx] = feature;
      return true;
    }
  });
};

proto.updatePkFeature = function(newValue, oldValue) {
  //TODO
};

proto.setFeatures = function(features) {
  this._features = features;
};

proto._removeFeature = function(feature) {
  this._features = this._features.filter((feat) => {
    return feature.getId() !== feat.getId();
  })
};

proto._clearFeatures = function() {
  this._features.splice(0);
};

proto.getDataProvider = function() {
  return this._provider;
};

// only read downloaded features
proto.readFeatures = function() {
  return this._features;
};

module.exports = FeaturesStore;
