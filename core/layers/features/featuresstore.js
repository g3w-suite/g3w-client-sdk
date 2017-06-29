var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function FeaturesStore(options) {
  var self = this;
  options = options || {};
  this._features = [];
  this._dataprovider = options.dataprovider || null;
  this.setters = {
    addFeatures: function(features) {
      _.forEach(features, function(feature) {
        self._addFeature(feature);
      })
    },
    addFeature: function(feature) {
      self._addFeature(feature);
    },
    removeFeature: function(feature) {
      self._removeFeature(feature);
    },
    clearFeatures: function() {
      self._clearFeatures()
    }
  };

  base(this);
}

inherit(FeaturesStore, G3WObject);

proto = FeaturesStore.prototype;

proto.getFeatures = function(options) {
  var self = this;
  var d = $.Deferred();
  this._dataprovider.getFeatures(options)
    .then(function(features) {
      console.log(features);
      // il provider ritornerà 
      self.addFeatures(features);
      d.resolve(self._features);
    });
  return d.promise();
};

proto._addFeature = function(feature) {
  this._features.push(feature);
};

proto._removeFeature = function(feature) {
  this._features.push(feature);
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