const inherit = require('core/utils/utils').inherit;
const resolve = require('core/utils/utils').resolve;
const G3WObject = require('core/g3wobject');

function VectorLayer(config) {
  config = config || {};
  this.geometrytype = config.geometrytype || null;
  this.format = config.format || null;
  this.crs = config.crs  || null;
  this.crsLayer = config.crsLayer || this.crs;
  this.id = config.id || null;
  this.name = config.name || "";
  this.pk = config.pk || "id";
  this._olSource = new ol.source.Vector({
    features: new ol.Collection()
  });
  this._olLayer = new ol.layer.Vector({
    name: this.name,
    source: this._olSource
  });
  this._isReady = false;
  /*
   * Array objects:
   * {
   *  name: Attribute name,
   *  type: integer | float | string | boolean | date | time | datetime,
   *  input: {
   *    label: Label fild input,
   *    type: select | check | radio | coordspicker | boxpicker | layerpicker | fielddepend,
   *    options: {
   *      type of inputso di input (es. "values" select, radio, etc ..)
   *    }
   *  }
   * }
  */
  this._PKinAttributes = false;
  this._featuresFilter = null;
  this._fields = null;
  this._relationsDataLoaded = {};
  this.lazyRelations = true;
  this._relations = null;
  this._editingMode = config.editing || false;
  this._loadedIds = [];
  this._featureLocks = [];
  this._crs = null;
}

inherit(VectorLayer,G3WObject);

module.exports = VectorLayer;

const proto = VectorLayer.prototype;

proto.getPk = function() {
  return this.pk;
};

proto.setData = function(featuresData) {
  const Ids = [];
  let features;
  if (this.format) {
    switch (this.format){
      case "GeoJSON":
        const geojson = new ol.format.GeoJSON({
          geometryName: "geometry"
        });
        features = geojson.readFeatures(featuresData, {
          dataProjection: this.crsLayer,
          featureProjection: this.crs
        });
        break;
    }
    if (this._editingMode && this._featureLocks) {
      features = features.filter((feature) => {
        let hasFeatureLock = false;
        this._featureLocks.forEach((featureLock) =>{
          if (featureLock.featureid == feature.getId()) {
            hasFeatureLock = true;
            Ids.push(feature.getId());
          }
        });
        return hasFeatureLock;
      })
    }

    if (features && features.length) {
      if (!_.isNull(this._featuresFilter)){
        features = features.map((feature) => {
          return this._featuresFilter(feature);
        });
      }
      const featuresToLoad = features.filter((feature) => {
        return !_.includes(this._loadedIds, feature.getId());
      });

      this._olSource.addFeatures(featuresToLoad);
      // check, get firts feature, if there is PK into the attributes
      const attributes = this.getSource().getFeatures()[0].getProperties();
      this._PKinAttributes = _.get(attributes,this.pk) ? true : false;
      this._loadedIds = _.union(this._loadedIds, Ids);
    }
  }
  else {
    console.log("VectorLayer format not defined");
  }
};
proto.cleanFeatureLocks = function() {
  this._featureLocks = [];
};

proto.setFeatureLocks = function(featurelocks) {
  this._featureLocks = featurelocks;
};

proto.getFeatureLocks = function() {
  return this._featureLocks;
};

proto.addLockId = function(lockId) {
  this._featureLocks.push(lockId);
};

proto.addFeature = function(feature) {
  this.getSource().addFeature(feature);
};

proto.addFeatures = function(features) {
  this.getSource().addFeatures(features);
};

proto.modifyFeatureGeometry = function(featureId, geometry) {
  const features = this.getFeatures();
  let feature = null;
  features.forEach((feature, index) => {
    if (feature.getId() == featureId) {
      features[index].setGeometry(geometry);
      feature = feature[index];
      return feature
    }
  });
  return feature;
};

proto.setFeaturesFilter = function(featuresFilter){
  this._featuresFilter = featuresFilter;
};

proto.setFields = function(fields) {
  this._fields = fields;
};

proto.setCrs = function(crs) {
  this._crs = crs;
};

proto.getCrs = function() {
  return this._crs;
};

proto.setPkField = function(){
  let pkfieldSet = false;
  this._fields.forEach((field) => {
    if (field.name == this.pk ){
      pkfieldSet = true;
    }
  });
  if (!pkfieldSet) {
    this._fields;
  }
};

proto.getFeatures = function() {
  return this.getSource().getFeatures();
};

proto.getFeatureIds = function(){
  const featureIds = _.map(this.getSource().getFeatures(), function(feature){
    return feature.getId();
  });
  return featureIds
};

// get feature from layer by geometry intersect
proto.getIntersectedFeatures = function(geometry) {
  const features = [];
  this.getFeatures().forEach((feature) => {
    if (geometry.intersectsExtent(feature.getGeometry().getExtent())) {
      features.push(feature);
    }
  });
  return features
};


proto.getFields = function(){
  return _.cloneDeep(this._fields);
};

// get atrributes
proto.getAttributes = function() {
  return this._fields;
};

proto.getFieldsNames = function(){
  return _.map(this._fields,function(field){
    return field.name;
  });
};

//used by for example before open a form
proto.getFieldsWithValues = function(obj) {
  // clone fields without modify the original
  const fields = _.cloneDeep(this._fields);
  let feature, attributes;
  if (obj instanceof ol.Feature){
    feature = obj;
  }
  else if (obj){
    feature = this.getFeatureById(obj);
  }
  // get proprety feature
  if (feature) {
    attributes = feature.getProperties();
  }
  fields.forEach((field) => {
    if (feature){
      if (!this._PKinAttributes && field.name == this.pk) {
        if (this.isNewFeature(feature.getId())) {
          field.value = null;
        } else {
          field.value = feature.getId();
        }
      } else {

        field.value = attributes[field.name];
      }
    }
    else{
      field.value = null;
    }
  });
  return fields;
};

// set realtions
proto.setRelations = function(relations) {
  this._relations = relations;
  // array that store relation with others layers
  relations.forEach((relation) => {
    // for each relation loop on each attributes (array) of objects
    // that describe the relation
    relation.fields.forEach((field, idx) => {
      if (field.name == relation.pk) {
       // add pkFieldIndex
        // usefultto get the field
        // primary of the layer relation
        // and set primary key
        relation.pkFieldIndex = idx
      }
    })
  })
};
// get Realations
proto.getRelations = function() {
  return this._relations;
};

// get relations attributes
proto.getRelationsAttributes = function() {
  const fields = {};
  this._relations.forEach((relation) => {
    fields[relation.name] = relation.fields;
  });
  return fields;
};
proto.getRelation = function(relationName) {
  let relation;
  this._relations.forEach((_relation) => {
    if (_relation.name == relationName) {
      relation = _relation;
    }
  });
  return relation;
};

proto.hasRelations = function() {
  return !_.isNull(this._relations);
};

proto.getRelationPkFieldIndex = function(relation) {
  let pkFieldIndex;
  relation.fields.forEach((field,idx) => {
    if (field.name == relation.pk) {
      pkFieldIndex = idx;
    }
  });
  return pkFieldIndex;
};

proto.getRelationElementPkValue = function(relation,element) {
  const pkFieldIndex = this.getRelationPkFieldIndex(relation);
  return element.fields[pkFieldIndex].value;
};

proto.getRelationsFksKeys = function(){
  const fks = [];
  this._relations.forEach((relation) => {
    fks.push(relation.fk);
  });
  return fks;
};

proto.getRelationFields = function(relation) {
  return relation.fields;
};

proto.getRelationFieldsNames = function(relation){
  return _.map(relationFields,function(field){
    return field.name;
  });
};

// get realtion by fid of the existing feature
proto.getRelationsWithValues = function(fid) {
  if (!this._relations) {
    // if no one relation reture empty array
    resolve([]);
  }
  // otherwise  clone relations
  const relations = _.cloneDeep(this._relations);
  if (!fid && !this.getFeatureById(fid)) {
    relations.forEach((relation) => {
      relation.elements = [];
    });
    return resolve(relations);
  }
  else {
    if (this.lazyRelations) {
      // check if are loaded relation
      if (!this._relationsDataLoaded[fid]) {
        const d = $.Deferred();
        const attributes = this.getFeatureById(fid).getProperties();
        const fks = {};
        relations.forEach((relation) => {
          _.forEach(relation.fk, (fkKey) => {
            if (fkKey == this.pk)  {
              fks[fkKey] = fid;
            } else {
              fks[fkKey] = attributes[fkKey];
            }
          });
        });
        this.getRelationsWithValuesFromFks(fks)
          .then((relationsResponse) => {
            this._relationsDataLoaded[fid] = relationsResponse;
            d.resolve(relationsResponse);
          })
          .fail(function(){
            d.reject();
          });
        return d.promise();
      }
      else {
        return resolve(this._relationsDataLoaded[fid]);
      }
    }
    else {
      return resolve(this._relations);
    }
  }
};

// get realtions with values
proto.getRelationsWithValuesFromFks = function(fks, newRelation) {
  const relations = _.cloneDeep(this._relations);
  const relationsRequests = [];
  relations.forEach((relation) => {
    relation.elements = [];
    let url = relation.url;
    const keyVals = [];
    _.forEach(relation.fk,function(fkKey){
      const fkValue = fks[fkKey];
      keyVals.push(fkKey+"="+fkValue);
    });
    const fkParams = _.join(keyVals,"&");
    url += "?"+fkParams;
    relationsRequests.push($.get(url)
      .then((relationsElements) => {
        if (relationsElements.length) {
          relationsElements.forEach((relationElement) => {
            const element = {};
            element.fields = _.cloneDeep(relation.fields);
            element.fields.forEach((field) => {
              field.value = relationElement[field.name];
              if (field.name == relation.pk) {
                element.id = field.value;
                const state = newRelation ? 'NEW' : 'OLD';
                element.state = state; // flag to identify element: 'NEW', 'OLD', 'DELETED'
              }
            });
            relation.elements.push(element);
          })
        }
      })
    )
  });

  return $.when.apply(this,relationsRequests)
  .then(() => {
    return relations;
  });
};

proto.getNewRelationsWithValuesFromFks = function(fks){
  return this.getRelationsWithValuesFromFks(fks, true)
};

proto.featureHasRelationsFksWithValues = function(feature){
  const attributes = feature.getProperties();
  const fksKeys = this.getRelationsFksKeys();
  return _.every(fksKeys, (fkKey) => {
    const value = attributes[fkKey];
    return (!_.isNil(value) && value != '');
  })
};

proto.getRelationsFksWithValuesForFeature = function(feature){
  const attributes = feature.getProperties();
  const fks = {};
  const fksKeys = this.getRelationsFksKeys();
  _.forEach(fksKeys, (fkKey) => {
    fks[fkKey] = attributes[fkKey];
  });
  return fks;
};


proto.setRelationsData = function (fid, relationsData) {
  this._relationsDataLoaded[fid] = relationsData;
};

proto.setStyle = function(style){
  this._olLayer.setStyle(style);
};

proto.getMapLayer = function(){
  return this._olLayer;
};

proto.getSource = function(){
  return this._olLayer.getSource();
};

proto.getFeatureById = function(fid){
  if (fid) {
    return this._olLayer.getSource().getFeatureById(fid);
  }
};

proto.isVisible = function() {
  return this._olLayer.getVisible();
};

proto.setVisible = function(bool) {
  this._olLayer.setVisible(bool);
};

proto.clear = function(){
  this.getSource().clear();
};

proto.addToMap = function(map){
  map.addLayer(this._olLayer);
};

proto.isNewFeature = function(fid){
  if (fid) {
    return fid.toString().indexOf(this._newPrefix) == 0;
  }
  return true;
};

