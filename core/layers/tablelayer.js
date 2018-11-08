const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const Layer = require('./layer');
const Editor = require('core/editing/editor');
const FeaturesStore = require('./features/featuresstore');
const Feature = require('./features/feature');
const Relations = require('core/relations/relations');


// Base Layer that support editing
function TableLayer(config, options={}) {
  const ProjectsRegistry = require('core/project/projectsregistry');
  // setters
  this.setters = {
    // delete all features
    clearFeatures: function () {
      this._clearFeatures();
    },
    addFeature: function (feature) {
      this._addFeature(feature);
    },
    deleteFeature: function (feature) {
      this._deleteFeature(feature);
    },
    updateFeature: function (feature) {
      this._updateFeature(feature);
    },
    setFeatures: function (features) {
      this._setFeatures(features);
    },
    // get data from every sources (server, wms, etc..)
    // throught provider related to fetauresstore
    getFeatures: function (options) {
      const d = $.Deferred();
      this._featuresStore.getFeatures(options)
        .then((promise) => {
          promise.then((features) => {
            this.emit('getFeatures', features);
            return d.resolve(features);
          }).fail((err) => {
            return d.reject(err);
          })
        })
        .fail((err) => {
          d.reject(err);
        });
      return d.promise();
    },
    commit: function(commitItems, featurestore) {
      const d = $.Deferred();
      this._featuresStore.commit(commitItems, featurestore)
        .then((promise) => {
          promise
            .then((response) => {
              // if commit go right
              let features;
              if (featurestore)
                features = _.clone(featurestore.readFeatures());
              features.forEach((feature) => {
                  feature.clearState();
                });
                this._featuresStore.setFeatures(features);
              this.applyCommitResponse(response);
              return d.resolve(response);
            })
            .fail((err) => {
              return d.reject(err);
          })
        })
        .fail((err)  => {
          d.reject(err);
        });
      return d.promise();
    },
    setColor: function(color) {
      this._setColor(color)
    }
  };
  /*
   * editing url api:
   * /api/vector/<type of request: data/editing/config>/<project_type>/<project_id>/<layer_id>
   * example: /api/vector/config/qdjango/10/points273849503023
   *
  */
  this.type = Layer.LayerTypes.TABLE;
  // creare an instace of editor
  this._editor = new Editor({
    layer: this
  });
  // color
  this._color = null;
  const currentProject = options.project || ProjectsRegistry.getCurrentProject();
  // set urls
  const projectType = currentProject.getType();
  const projectId = currentProject.getId();
  const vectorUrl = initConfig.vectorurl;
  const suffixUrl = projectType + '/' + projectId + '/' + config.id + '/';
  // add urls
  config.urls = {
    editing: vectorUrl + 'editing/' + suffixUrl ,
    commit:vectorUrl + 'commit/' + suffixUrl ,
    config: vectorUrl + 'config/' + suffixUrl,
    unlock: vectorUrl + 'unlock/' + suffixUrl,
    widget: {
      unique: vectorUrl + 'widget/unique/data/' + suffixUrl
    }
  };
  // add cediting configurations
  config.editing = {
    pk: null, // primary key
    fields: [] // editing fields
  };
  // call base layer
  base(this, config);
  const projectRelations = currentProject.getRelations();
  // create realations
  this._relations = null;
  this._createRelations(projectRelations);
  // add state info for the layer
  this.state = _.merge({
    editing: {
      started: false,
      modified: false,
      ready: false,
      ispkeditable: false
    }
  }, this.state);
  // get configuration from server if is editable
  if (this.isEditable()) {
    this.getEditingConfig()
      .then((config) => {
        this.config.editing.pk = config.vector.pk;
        this.config.editing.fields = config.vector.fields;
        this.config.editing.format = config.vector.format;
        this._setOtherConfigParameters(config);
        this._setPkEditable(this.config.editing.fields);
        this.setReady(true);
      })
      .fail((err) => {
        this.setReady(false);
      })
      .always(() => {
        this.emit('layer-config-ready', this.config);
      })
  }
  this._featuresStore = new FeaturesStore({
    provider: this.providers.data
  });
}

inherit(TableLayer, Layer);

const proto = TableLayer.prototype;

proto._setColor = function(color) {
  this._color = color;
};

proto.getColor = function() {
  return this._color;
};

proto.readFeatures = function() {
  return this._featuresStore.readFeatures();
};

// return layer for editing
proto.getLayerForEditing = function() {
  // if the original layer is a vector layer return itself
  return this;
};

proto.isFieldRequired = function(fieldName) {
  let required = false;
  this.getEditingFields().forEach((field) => {
    if (fieldName == field.name) {
      required = !!field.validate.required;
      return false;
    }
  });
  return required;
};

// apply response data from server in case of new inserted feature
proto.applyCommitResponse = function(response) {
  const data = response;
  if (data && data.result) {
    let feature;
    const ids = data.response.new;
    const lockids = data.response.new_lockids;
    ids.forEach((idobj) => {
      feature = this._featuresStore.getFeatureById(idobj.clientid);
      feature.setId(idobj.id);
    });
    this._featuresStore.addLockIds(lockids);
  }
};

// unlock editng features
proto.unlock = function() {
  const d = $.Deferred();
  this._featuresStore.unlock()
    .then(() => {
      d.resolve()
    })
    .fail((err) => {
      d.reject(err);
    });
  return d.promise();
};

proto._setOtherConfigParameters = function(config) {
  // overwrite by vector layer
};

// return layer fields
proto.getEditingFields = function() {
  return this.config.editing.fields.length ? this.config.editing.fields: this.config.fields;
};

proto.getFieldsLabel = function() {
  const labels = [];
  this.getEditingFields().forEach((field) => {
    labels.push(field.label)
  });
  return labels;
};

proto.getDataFormat = function() {
  return this.config.editing.format;
};

proto.getPk = function() {
  return this.config.editing.pk;
};

proto._setPkEditable = function(fields) {
  fields.forEach((field) => {
    if (field.name == this.getPk()) {
      this.state.editing.ispkeditable = field.editable;
      return false;
    }
  })
};

// return fields of editing
proto.getEditingFields = function() {
  return this.config.editing.fields;
};

// raw data
proto.getEditingFormat = function() {
  return this.config.editing.format;
};

proto.isReady = function() {
  return this.state.editing.ready;
};

proto.setReady = function(bool) {
  this.state.editing.ready = _.isBoolean(bool) ? bool : false;
};

proto.isPkEditable = function() {
  return this.state.editing.ispkeditable;
};

// get configuration from server
proto.getEditingConfig = function(options={}) {
  const d = $.Deferred();
  const provider = this.getProvider('data');
  provider.getConfig(options)
    .then((config) => {
      d.resolve(config);
    })
    .fail((err) => {
      d.reject(err)
    });
  return d.promise()
};

proto.getWidgetData = function(options) {
  const provider = this.getProvider('data');
  const d = $.Deferred();
  provider.getWidgetData(options)
    .then((response) => {
      d.resolve(response);
    })
    .fail((err) => {
      d.reject(err)
    });
  return d.promise()

};

proto.getCommitUrl = function() {
  return this.config.urls.commit;
};

proto.setCommitUrl = function(url) {
  this.config.urls.commit = url;
};

proto.getEditingUrl = function() {
  return this.config.urls.editing;
};

proto.setEditingUrl = function(url) {
  this.config.urls.editing = url;
};

proto.getUnlockUrl = function() {
  return this.config.url.unlock;
};

proto.setUnlockUrl = function(url) {
  this.config.urls.unlock = url;
};

proto.getWidgetUrl = function() {
  return this.config.urls.widget;
};

// set data url
proto.setDataUrl = function(url) {
  this.config.urls.data = url;
};

proto.getDataUrl = function() {
  return this.config.urls.data;
};

// url to get config layer
proto.getConfigUrl = function() {
  return this.config.urls.config;
};

proto.setConfigUrl = function(url) {
  this.config.urls.index = url;
};

proto.getEditor = function() {
  return this._editor;
};

proto.setEditor = function(editor) {
  this._editor = editor;
};

proto.getFeaturesStore = function() {
  return this._featuresStore;
};

proto.setFeaturesStore = function(featuresstore) {
  this._featuresStore = featuresstore;
};

proto.setSource = function(source) {
  this.setFeaturesStore(source);
};

proto.getSource = function() {
  return this._featuresStore;
};

proto._setFeatures = function(features) {
  this._featuresStore.setFeatures(features);
};

proto.addFeatures = function(features) {
  features.forEach((feature) => {
    this.addFeature(feature);
  });
};

proto._addFeature = function(feature) {
  this._featuresStore.addFeature(feature);
};

proto._deleteFeature = function(feature) {
  return feature.getId();
};

proto._updateFeature = function(feature) {
  //
};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};

proto.addLockIds = function(lockIds) {
  this._featuresStore.addLockIds(lockIds);
};

proto.setFieldsWithValues = function(feature, fields) {
  const attributes = {};
  let pkValue;
  fields.forEach((field)=> {
    // check if primary key is editbale
    if (feature.getPk() == field.name && field.editable) {
      pkValue = field.type == "integer" ? 1* field.value : field.value;
      feature.setId(pkValue);
    } else {
      // case selct force to null
      if (field.value == 'null') {
        field.value = null;
      }
      attributes[field.name] = field.value;
    }
  });
  feature.setProperties(attributes);
  return attributes;

};

proto.getFieldsWithValues = function(obj, options) {
  options = options || {};
  const exclude = options.exclude || [];
  const relation = options.relation || false;
  // colne fields
  let fields = _.cloneDeep(this.getEditingFields());
  let feature, attributes;
  if (obj instanceof Feature){
    feature = obj;
  }
  else if (obj){
    feature = this.getFeatureById(obj);
  }
  if (feature) {
    attributes = feature.getProperties();
  }
  fields = fields.filter((field) =>  {
    //check if field is pk and if is new nad if is not editable
    if (!relation && (field.name == this.config.editing.pk) && feature.isNew() && !this.isPkEditable()) {
        return false;
    }
    return exclude.indexOf(field.name) == -1;
  });
  fields.forEach((field) => {
    if (feature) {
      // check if pk
      if (field.name == this.config.editing.pk) {
        let editable = this.isPkEditable();
        // che check if has a value
        if (feature.getId()) {
          field.value = feature.getId();
          editable = false;
        } else {
          field.value = null;
        }
        field.editable = editable;
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

proto._createRelations = function(projectRelations) {
  const relations = [];
  const layerId = this.getId();
  projectRelations.forEach((relation) => {
    if ([relation.referencedLayer, relation.referencingLayer].indexOf(layerId) != -1)
      relations.push(relation);
  });
  if (!!relations.length) {
    this._relations = new Relations({
      relations: relations
    });
  }
  return relations;
};

proto.createNewFeature = function() {
  let feature = new ol.Feature();
  const properties = {};
  _.forEach(this.getEditingFields(), function(field) {
    properties[field.name] = null;
  });
  feature.setProperties(properties);
  feature = new Feature({
    feature : feature,
    pk: this.getPk()
  });
  //check if primary key is editable
  if (!this.isPkEditable())
    feature.setTemporaryId();
  else
    feature.setNew();
  return feature;
};

// retunr relations of layer
proto.getRelations = function() {
  return this._relations
};


proto.getRelationAttributes = function(relationName) {
  let fields = [];
  this._relations.forEach((relation) => {
    if (relation.name == relationName) {
      fields = relation.fields;
      return false
    }
  });
  return fields;
};

proto.getRelationsAttributes = function() {
  const fields = {};
  this.state.relations.forEach((relation) => {
    fields[relation.name] = relation.fields;
  });
  return fields;
};

proto.isChild = function() {
  if (!this.getRelations())
    return false;
  return this._relations.isChild(this.getId());
};

proto.isFather = function() {
  if (!this.getRelations())
    return false;
  return this._relations.isFather(this.getId());
};

proto.getChildren = function() {
  if (!this.isFather())
    return [];
  return this._relations.getChildren(this.getId());
};

proto.getFathers = function() {
  if (!this.isChild())
    return [];
  return this._relations.getFathers(this.getId());
};

proto.hasChildren = function() {
  if (!this.hasRelations())
    return false;
  return this._relations.hasChildren(this.getId());
};

proto.hasFathers = function() {
  if (!this.hasRelations())
    return false;
  return this._relations.hasFathers(this.getId());
};

proto.hasRelations = function() {
  return !!this._relations;
};


module.exports = TableLayer;
