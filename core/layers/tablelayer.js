const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const Layer = require('./layer');
const Editor = require('core/editing/editor');
const FeaturesStore = require('./features/featuresstore');
const Feature = require('./features/feature');
const Relations = require('core/relations/relations');

// Base Layer that support editing
function TableLayer(config={}, options={}) {
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
    // throught provider related to featuresstore
    getFeatures: function (options={}) {
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
      this._featuresStore.commit(commitItems)
        .then((promise) => {
          promise
            .then((response) => {
              // if commit go right
              // apply commit changes to features store eventually passed (ex: session featurestore)
              if (featurestore) {
                features = featurestore.readFeatures();
                this._featuresStore.setFeatures(features);
              }
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
  // color
  this._color = null;
  options.project = options.project || ProjectsRegistry.getCurrentProject();
  const {project} = options;
  // set urls
  this.projectId = project.getId();
  this.layerId = config.id;
  this.projectType = options.project_type || project.getType();
  this.vectorUrl = options.vectorurl || initConfig.vectorurl;
  // add urls
  config.urls = config.urls || {};
  //add editing urls
  this.setEditingUrls({
    urls: config.urls
  });
  // add editing configurations
  config.editing = {
    pk: null, // primary key
    fields: [], // editing fields,
  };
  // call base layer
  base(this, config, options);
  const projectRelations = project.getRelations();
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
      .then(({vector, constraints}={}) => {
        this.config.editing.pk = vector.pk;
        this.config.editing.fields = vector.fields;
        this.config.editing.format = vector.format;
        this.config.editing.constraints = constraints || {};
        this.config.editing.style = vector.style || {};
        this._setOtherConfigParameters(vector);
        if (vector.style) {
          this.setColor(vector.style.color)
        }
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
  // creare an instace of editor
  this._editor = new Editor({
    layer: this
  });
}

inherit(TableLayer, Layer);

const proto = TableLayer.prototype;

proto.clone = function() {
  return _.cloneDeep(this);
};

proto.cloneFeatures = function() {
  return this._featuresStore.clone();
};

proto.setVectorUrl = function(url) {
  this.vectorUrl = url;
};

proto.setProjectType = function(projectType) {
  this.projectType = projectType;
};

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
proto.getLayerForEditing = function({vectorurl, project_type}={}) {
  vectorurl && this.setVectorUrl(vectorurl);
  project_type && this.setProjectType(project_type);
  this.setEditingUrl();
  return this.clone();
};

proto.setEditingUrls = function({urls}={}) {
  const suffixUrl = `${this.projectType}/${this.projectId}/${this.layerId}/`;
  urls = urls || this.config.urls;
  urls.editing = `${this.vectorUrl}editing/${suffixUrl}`;
  urls.commit = `${this.vectorUrl}commit/${suffixUrl}`;
  urls.config = `${this.vectorUrl}config/${suffixUrl}`;
  urls.unlock = `${this.vectorUrl}unlock/${suffixUrl}`;
  urls.widget = {
    unique: `${this.vectorUrl}widget/unique/data/${suffixUrl}`
  }
};

proto.getEditingStyle = function() {
  return this.config.editing.style;
};

proto.setEditingStyle = function(style={}) {
  this.config.editing.style = style;
};

proto.getEditingConstrains = function() {
  return this.config.editing.constraints;
};

proto.isFieldRequired = function(fieldName) {
  let required = false;
  this.getEditingFields().forEach((field) => {
    if (fieldName === field.name) {
      required = !!field.validate.required;
      return false;
    }
  });
  return required;
};

// apply response data from server in case of new inserted feature
proto.applyCommitResponse = function(response={}) {
  if (response && response.result) {
    const {response:data} = response;
    const ids = data.new;
    const lockids = data.new_lockids;
    ids.forEach((idobj) => {
      const feature = this._featuresStore.getFeatureById(idobj.clientid);
      feature.setId(idobj.id);
      try {
        // temporary inside try ckeck if feature contain a field with the same pk of the layer
        feature.getKeys().indexOf(this.getPk()) !== -1 && feature.set(this.getPk(), idobj.id);
      } catch(err) {}
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
proto.getEditingFields = function(editable=false) {
  let fields = this.config.editing.fields.length ? this.config.editing.fields: this.config.fields;
  if (editable)
    fields = fields.filter((field) => {
      return field.editable;
    });
  return fields;
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
    if (field.name === this.getPk()) {
      this.state.editing.ispkeditable = field.editable;
      return false;
    }
  })
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
  this.getProvider('data')
    .getConfig(options)
      .then((config) => {
        d.resolve(config);
      })
      .fail((err) => {
        d.reject(err)
      });
  return d.promise()
};

proto.addEditingConfigFieldOption = function({field, key, value} = {}) {
  const options = field.input.options;
  options[key] = value;
  return options[key];
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

proto._updateFeature = function(feature) {};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};

proto.addLockIds = function(lockIds) {
  this._featuresStore.addLockIds(lockIds);
};

proto.setFieldsWithValues = function(feature, fields) {
  let pkValue;
  const createAttributesFromFields = (fields) => {
    const attributes = {};
    fields.forEach((field) => {
      if (field.type === 'child') {
        attributes[field.name] = createAttributesFromFields(field.fields);
      } else {
        // check if primary key is editbale
        if (feature.getPk() === field.name && field.editable) {
          pkValue = field.type === "integer" ? 1* field.value : field.value;
          feature.setId(pkValue);
        } else {
          // case selct force to null
          if (field.value === 'null') {
            field.value = null;
          }
          attributes[field.name] = field.value;
        }
      }
    });
    return attributes;
  };
  const attributes = createAttributesFromFields(fields);
  feature.setProperties(attributes);
  return attributes;
};

proto.getFieldsWithValues = function(obj, options={}) {
  const exclude = options.exclude || [];
  const relation = options.relation || false;
  let fields = JSON.parse(JSON.stringify(this.getEditingFields()));
  let feature;
  if (obj instanceof Feature) feature = obj;
  else if (obj instanceof ol.feature.Feature) feature = new Feature({
      feature: obj
    });
  else feature = obj && this.getFeatureById(obj);
  if (feature) {
    const attributes = feature.getProperties();
    fields = fields.filter((field) =>  {
      //check if field is pk and if is new nad if is not editable
      return (!relation && (field.name === this.config.editing.pk) && feature.isNew() && !this.isPkEditable()) ? false : exclude.indexOf(field.name) === -1;
    });
    fields.forEach((field) => {
      // check if pk
      if (field.name === this.config.editing.pk) {
        let editable = this.isPkEditable();
        // che check if has a value
        if (feature.getId()) {
          field.value = feature.getId();
          editable = feature.isNew();
        } else field.value = null;
        field.editable = editable;
      } else field.value = attributes[field.name];

      if (field.type !== 'child' && field.input.type === 'select_autocomplete' && !field.input.options.usecompleter) {
        const _configField = this.getEditingFields().find((_field) => {
          return _field.name === field.name
        });
        const options = _configField.input.options;
        field.input.options.loading = options.loading;
        field.input.options.values = options.values;
      }
      // for editing purpose
      if (field.validate === undefined)
        field.validate = {};
      field.validate.valid = true;
      field.validate.unique = true;
      field.validate.required = field.validate.required === undefined ? false : field.validate.required;
      field.validate.empty = field.validate.required;
      field.validate.message = null;
      // end editng purpose
    });
  }
  return fields;
};

proto._createRelations = function(projectRelations) {
  const relations = [];
  const layerId = this.getId();
  projectRelations.forEach((relation) => {
    if ([relation.referencedLayer, relation.referencingLayer].indexOf(layerId) !== -1)
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
    if (relation.name === relationName) {
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
