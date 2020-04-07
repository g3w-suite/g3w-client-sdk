import Applicationstate from 'core/applicationstate';
const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const FeaturesStore = require('core/layers/features/featuresstore');
const OlFeaturesStore = require('core/layers/features/olfeaturesstore');
const Layer = require('core/layers/layer');
const ChangesManager = require('./changesmanager');

// class Editor bind editor to layer to do main actions
function Editor(options={}) {
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
    setFeatures: function(features=[]) {
      this._setFeatures(features);
    },
    getFeatures: function(options={}) {
      return this._getFeatures(options);
    }
  };
  base(this);
  // filter to getFeaturerequest
  this._filter = {
    bbox: null
  };

  this._allfeatures = false;
  // referred layer
  this._layer = options.layer;
  // editing featurestore
  this._featuresstore = this._layer.getType() === Layer.LayerTypes.TABLE ? new FeaturesStore() : new OlFeaturesStore();
  // editor is active or not
  this._started = false;
}

inherit(Editor, G3WObject);

const proto = Editor.prototype;

proto._canDoGetFeaturesRequest = function(options={}) {
  let doRequest = true;
  if (this._layer.getType() === Layer.LayerTypes.VECTOR) {
    const {bbox} = options.filter || {};
    if(bbox) {
      if(!this._filter.bbox)
        this._filter.bbox = bbox;
      else if(!ol.extent.containsExtent(this._filter.bbox, bbox)) {
        this._filter.bbox = ol.extent.extend(this._filter.bbox, bbox);
      } else
        doRequest = false;
    }
  }
  return doRequest
};

proto.getEditingSource = function() {
  return this._featuresstore;
};

proto.getSource = function() {
  this._layer.getSource();
};

proto._applyChanges = function(items=[], reverse=true) {
  ChangesManager.execute(this._featuresstore, items, reverse);
};

proto.setChanges = function(items, reverse) {
  this._applyChanges(items, reverse)
};

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
  return this._layer;
};

//clone features method
proto._cloneFeatures = function(features) {
  return features.map((feature) => feature.clone());
};

proto._addFeaturesFromServer = function(features=[]){
  features = this._cloneFeatures(features);
  this._featuresstore.addFeatures(features);
};

proto._doGetFeaturesRequest = function(options={}) {
  const doRequest = Applicationstate.online &&  !this._allfeatures;
  return doRequest && this._canDoGetFeaturesRequest(options)
};

// fget features methods
proto._getFeatures = function(options={}) {
  const d = $.Deferred();
  const doRequest = this._doGetFeaturesRequest(options);
  if (!doRequest) d.resolve();
  else
    this._layer.getFeatures(options)
      .then((promise) => {
        promise.then((features) => {
          this._addFeaturesFromServer(features);
          this._allfeatures = !options.filter;
          return d.resolve(features);
        }).fail((err) => {
          return d.reject(err);
        })
      })
      .fail(function (err) {
        d.reject(err);
      });
  return d.promise();
};

// method to revert (cancel) all changes in history and clean session
proto.revert = function() {
  const d = $.Deferred();
  const features  = this._cloneFeatures(this._layer.readFeatures());
  this._featuresstore.setFeatures(features);
  d.resolve();
  return d.promise();
};

proto.rollback = function(changes=[]) {
  const d = $.Deferred();
  this._applyChanges(changes, true);
  d.resolve();
  return d.promise()
};

proto.applyChangesToNewRelationsAfterCommit = function(relationsResponse) {
  for (const relationLayerId in relationsResponse) {
    const response = relationsResponse[relationLayerId];
    const layer = this.getLayerById(relationLayerId);
    const editingLayerSource = this.getEditingLayer(relationLayerId).getEditingSource();
    const features = editingLayerSource.readFeatures();
    features.forEach((feature) => {
      feature.clearState();
    });
    layer.getSource().setFeatures(features);
    layer.applyCommitResponse({
      response,
      result: true
    });
    editingLayerSource.setFeatures(layer.getSource().readFeatures());
  }
};

// apply response data from server in case of new inserted feature
proto.applyCommitResponse = function(response={}) {
  if (response && response.result) {
    const {response:data} = response;
    const ids = data.new;
    const lockids = data.new_lockids;
    const pk = this._layer.getPk();
    ids.forEach((idobj) => {
      const feature = this._featuresstore.getFeatureById(idobj.clientid);
      feature.setId(idobj.id);
      try {
        // temporary inside try ckeck if feature contain a field with the same pk of the layer
        Object.keys(feature.getProperties()).indexOf(pk) !== -1 && feature.set(pk, idobj.id);
      } catch(err) {}
    });
    this._layer.getSource().addLockIds(lockids);
  }
};

// run after server apply chaged to origin resource
proto.commit = function(commitItems) {
  const d = $.Deferred();
  this._layer.commit(commitItems)
    .then((promise) => {
      promise
        .then((response) => {
          this.applyCommitResponse(response);
          const features = this._featuresstore.readFeatures();
          features.forEach(feature => feature.clearState());
          this._layer.setFeatures(features);
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
  this._featuresstore.addFeature(feature);
};

proto._deleteFeature = function(feature) {
  this._featuresstore.deleteFeature(feature);
};

proto._updateFeature = function(feature) {
  this._featuresstore.updateFeature(feature);
};

proto._setFeatures = function(features) {
  this._featuresstore.setFeatures(features);
};

proto.readFeatures = function(){
  return this._layer.readFeatures();
};

proto.readEditingFeatures = function(){
  return this._featuresstore.readFeatures()
};

// stop editor
proto.stop = function() {
  const d = $.Deferred();
  this._layer.unlock()
    .then((response) => {
      this._started = false;
      this._filter.bbox = null;
      this._allfeatures = false;
      this.clear();
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
  this._featuresstore.clear();
  this._layer.getFeaturesStore().clear();
  this._layer.getType() === Layer.LayerTypes.VECTOR && this._layer.resetEditingSource( this._featuresstore.getFeaturesCollection());
};


module.exports = Editor;
