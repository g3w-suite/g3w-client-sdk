var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function FeaturesStore(options) {
  var self = this;
  options = options || {};
  this._features = [];
  this._provider = options.provider || null;
  this._loadedPks = []; // contiene gli id loccati (che alla fine sono gli stessi delle feature caricate)
  this._lockIds = []; // contiene le features loccate
  this.setters = {
    addFeatures: function(features) {
      _.forEach(features, function(feature) {
        self._addFeature(feature);
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
    getFeatures: function(options) {
      return this._getFeatures(options);
    },
    commit: function(commitItems, featurestore) {
      return this._commit(commitItems, featurestore);
    }
  };

  base(this);
}

inherit(FeaturesStore, G3WObject);

proto = FeaturesStore.prototype;

// funzione per l'unlock delle features
proto.unlock = function() {
  return this._provider.unlock();
};

// funzione che recupera le features o dal server o dall'attributo _features
proto._getFeatures = function(options) {
  options = options || {};
  var self = this;
  var d = $.Deferred();
  var features;
  // verifico che ci sia un provider altrimenti vado a recuperare le
  if (this._provider) {
    this._provider.getFeatures(options)
      .then(function(options) {
        features = self._filterFeaturesResponse(options);
        self.addFeatures(features);
        d.resolve(features);
      })
      .fail(function(err) {
        d.reject(err)
      })
  } else {
    d.resolve(this._readFeatures());
  }
  return d.promise();
};

//funzione che in base alle features caricate filtra
// escludendo quelle già inserite
proto._filterFeaturesResponse = function(options) {
  var self = this;
  var added = false;
  options = options || {};
  var features = options.features || [];
  var featurelocks = options.featurelocks || [];
  var featuresToAdd = _.filter(features, function(feature) {
    added = _.includes(self._loadedPks, feature.getId());
    if (!added)
      self._loadedPks.push(feature.getId());
    return !added
  });
  self._filterLockIds(featurelocks);
  return featuresToAdd;
};

// funzione che mi dice le feature loccate
proto._filterLockIds = function(featurelocks) {
  var toAddLockId = _.differenceBy(featurelocks, this._lockIds, 'featureid');
  this._lockIds = _.union(this._lockIds, toAddLockId);
};

// aggiunge nuovi lock Ids
proto.addLockIds = function(lockIds) {
  this._lockIds = _.union(this._lockIds, lockIds);
};

proto._readFeatures = function() {
  return this._features;
};

proto._commit = function(commitItems, featurestore) {
  var d = $.Deferred();
  // verifico che ci siano opzioni e un provider altrimenti vado a recuperare le
  // features direttamente nel featuresstore
  if (commitItems && this._provider) {
    commitItems.lockids = this._lockIds;
    this._provider.commit(commitItems)
      .then(function(response) {
        d.resolve(response);
      })
      .fail(function(err) {
        d.reject(err);
      })
  } else {
    d.reject();
  }
  return d.promise();
};

// recupera una feature dal suo id
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

proto.updatePkFeature = function(newValue, oldValue) {
  var feature
};

proto.setFeatures = function(features) {
  this._features = features;
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
  this._features.splice(0, this._features.length);
};

proto.getDataProvider = function() {
  return this._dataprovider;
};

// metodo che a differenza del getFeatures prevede di fare
// la lettura delle features attualmente sul featuressotre
proto.readFeatures = function() {
  return this._features;
};

module.exports = FeaturesStore;