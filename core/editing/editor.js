const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');

// class Editor bind editor to layer to do main actions
function Editor(options={}) {
  this.setters = {
    save: function() {
      this._save();
    },
    getFeatures: function(options={}) {
      return this._getFeatures(options);
    }
  };
  base(this);
  // referred layer
  this._layer = options.layer;
  // clone featurestore of
  this._featuresstore = this._layer.getSource().clone();
  // editor is active or not
  this._started = false;
}

inherit(Editor, G3WObject);

const proto = Editor.prototype;

proto.getSource = function() {
  return this._featuresstore;
};

proto.getLayer = function() {
  return this._layer;
};

proto.setLayer = function(layer) {
  this._layer = layer;
  return this._layer;
};

// get features methods
proto._getFeatures = function(options={}) {
  const d = $.Deferred();
  this._layer.getFeatures(options)
    .then((promise) => {
      promise.then((features) => {
        // add features
        this._featuresstore.addFeatures(features);
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

proto.revert = function(){
  const features = this._layer.readFeatures();
  this._featuresstore.setFeatures(features);
};

// apply response data from server in case of new inserted feature
proto.applyCommitResponse = function(response={}) {
  // //array of unsetted new id (maybe cause by changes offline)
  const unsetnewids = [];
  if (response && response.result) {
    const {response:data} = response;
    const ids = data.new;
    const lockids = data.new_lockids || [];
    ids.forEach((idobj) => {
      const feature = this._featuresstore.getFeatureById(idobj.clientid);
      if (feature) {
        feature.setId(idobj.id);
        try {
          // temporary inside try ckeck if feature contain a field with the same pk of the layer
          feature.getKeys().indexOf(this.getPk()) !== -1 && feature.set(this.getPk(), idobj.id);
        } catch(err) {}
      } else unsetnewids.push(idobj);
    });
    this.addLockIds(lockids);
  }
  const features = this._featuresstore.readFeatures();
  features.forEach((feature) => {
    feature.clearState();
  });
  this._layer.getSource().setFeatures(features);
  return unsetnewids;
};

proto.getLockIds = function(){
  return this._layer.getSource().getLockIds();
};

proto.addLockIds = function(lockIds=[]) {
  this._layer.getSource().addLockIds(lockIds);
};

// run after server apply chaged to origin resource
proto.commit = function(commitItems) {
  const d = $.Deferred();
  this._layer.commit(commitItems)
    .then((promise) => {
      promise
        .then(response => {
          const unsetnewids = this.applyCommitResponse(response);
          return d.resolve(response, unsetnewids);
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

// stop editor
proto.stop = function() {
  const d = $.Deferred();
  this._layer.unlock()
    .then((response) => {
      this._started = false;
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
  this._layer.getSource().clear();
};


module.exports = Editor;
