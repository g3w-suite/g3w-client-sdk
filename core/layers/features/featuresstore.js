var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// Interfaccia per registare i layers
function FeaturesStore() {
  var self = this;
  this._features = [];
  this.setters = {
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

proto._addFeature = function(feature) {
  this._features.push(feature);
};

proto._removeFeature = function(feature) {
  this._features.push(feature);
};

proto._clearFeatures = function() {
  // vado a rimuovere le feature in modo reattivo utlizzando metodi che vue
  // possa reagire allacancellazione di elementi di un array
};

proto.readFeatures = function() {
  return this._features;
};

module.exports = FeaturesStore;