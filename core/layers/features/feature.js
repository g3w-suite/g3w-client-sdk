const uniqueId = require('core/utils/utils').uniqueId;
const Feature = function(options={}) {
  ol.Feature.call(this);
  this._uid = uniqueId();
  this._newPrefix = '_new_';
  this._pk = options.pk || "id";
  const feature = options.feature;
  if (feature) {
    this.setProperties(feature.getProperties());
    this.setId(feature.getId());
    this.setGeometryName(feature.getGeometryName());
    const geometry = feature.getGeometry();
    geometry && this.setGeometry(geometry);
    const style = this.getStyle();
    style && this.setStyle(style);
  }
  this.state = {
    new: false,
    state: null
  };
};

ol.inherits(Feature, ol.Feature);

const proto = Feature.prototype;

// vado a cambiare il costruttore
proto.constructor = 'Feature';

proto.getUid = function(){
  return this._uid
};

proto._setUid = function(uid){
  this._uid = uid;
};

proto.clone = function() {
  // clono la feature
  const feature = ol.Feature.prototype.clone.call(this);
  feature.setId(this.getId());
  const clone =  new Feature({
    feature: feature,
    pk: this._pk
  });
  clone._setUid(this.getUid());
  clone.setState(this.getState());
  this.isNew() && clone.setNew();
  return clone;
};

proto.setTemporaryId = function() {
  let newValue = this._newPrefix + Date.now();
  this.setId(newValue);
  this.getProperties()[this._pk] !== undefined && this.set(this._pk, newValue);
  this.setNew();
};

proto.setNew = function() {
  this.state.new = true;
};

proto.getPk = function() {
  return this._pk;
};

proto.isPk = function(field) {
  return field === this.getPk();
};

// setta la feature a state 2 delete
proto.delete = function() {
  this.state.state = 'delete';
  return this;
};

//setta lo stato a feature aggiornata
proto.update = function() {
  this.state.state = 'update';
  return this;
};

// setta lo stato a nuovo 0
proto.add = function() {
  this.state.state = 'add';
  return this;
};

proto.isNew = function() {
  return this.state.new;
};

proto.isAdded = function() {
  return this.state.state === 'add';
};

proto.isUpdated = function() {
  return this.state.state === 'update';
};

proto.isDeleted = function() {
  return this.state.state === 'delete';
};

proto.setFullState = function(state) {
  this.state = state;
};

proto.getFullState = function() {
  return this.state;
};

proto.setState = function(state) {
  this.state.state = state;
};

proto.getState = function() {
  return this.state.state;
};

proto.getAlphanumericProperties = function() {
  const properties = this.getProperties();
  const alphanumericproperties = {};
  for (let name in properties) {
    if (['boundedBy', 'geom','the_geom','geometry','bbox', 'GEOMETRY'].indexOf(name) === -1)
      alphanumericproperties[name] = properties[name];
  }
  alphanumericproperties[this._pk] = this.getId();
  return alphanumericproperties;
};

//clean state of the features
proto.clearState = function() {
  this.state.state = null;
  this.state.new = false;
};


module.exports = Feature;
