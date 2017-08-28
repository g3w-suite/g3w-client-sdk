var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Layer = require('./layer');
var Editor = require('core/editing/editor');
var FeaturesStore = require('./features/featuresstore');
var Feature = require('./features/feature');
var Relations = require('core/relations/relations');

// Layer di base su cui si possono fare operazioni di editing
function TableLayer(config) {
  var self = this;
  //////// al momento lo metto qui ////////////////////////////
  var ProjectRegistry = require('core/project/projectsregistry');
  var currentProject= ProjectRegistry.getCurrentProject();
  ///////////////////////////////////////////////////
  // setters
  this.setters = {
    // cancellazione di tutte le features del layer
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
    // funzione che recupera i dati da qualsisasi fonte (server, wms, etc..)
    // mediante il provider legato al fetauresstore
    getFeatures: function (options) {
      var self = this;
      options = options || {};
      // aggiunta temporanea
      options.id = this.getId();
      // passo la pk del layer per poter settare Id della feature
      options.pk = this.config.editing.pk;
      var d = $.Deferred();
      // qui mi ritorna la promessa del setter (G3WOBJECT)
      this._featuresStore.getFeatures(options)
        .then(function (promise) {
          promise.then(function (features) {
            self.emit('getFeatures', features);
            return d.resolve(features);
          }).fail(function (err) {
            return d.reject(err);
          })
        })
        .fail(function (err) {
          d.reject(err);
        });
      return d.promise();
    }
  };
  /*
   * composizione url editing api
   * la chimata /api/vector/<tipo di richiesta: data/editing/config>/<project_type>/<project_id>/<layer_id>
   * esempio /api/vector/config/qdjango/10/punti273849503023
   *
  */
  this.type = Layer.LayerTypes.TABLE;
  // istanzia un editor alla sua creazione
  this._editor = new Editor({
    layer: this
  });
  // relations of the layer
  var projectRelations = currentProject.getRelations();
  this._relations = null;
  // vado a settare urls che mi servono
  var projectType = currentProject.getType();
  var projectId = currentProject.getId();
  var vectorUrl = initConfig.vectorurl;
  // vado ad aggiungere gli url che mi servono
  config.urls = {
    editing: vectorUrl + 'editing/' + projectType + '/' + projectId + '/' + config.id + '/',
    data: vectorUrl + 'data/' + projectType + '/' + projectId + '/' + config.id + '/',
    config: vectorUrl + 'config/' + projectType + '/' + projectId + '/' + config.id + '/'
  };
  // aggiungo alla configurazione la parte di editing
  config.editing = {
    pk: null, // campo primary kaey
    fields: [] // campi utili all'editing
  };
  // vado a chiamare il Layer di base
  base(this, config);
  // aggiungo nformazioni allo state che sono solo necessarie a layer
  // di possibile editing
  this.state = _.merge({
    editing: {
      start: false,
      modified: false
    }
  }, this.state);
  // vado a creare le relazioni
  this._createRelations(projectRelations);
  // vado a recuperare la configurazione dal server

  this.getEditingConfig({
    id: this.getId() // aggiunto al momento per utilizzare dato fake
  })
    .then(function(config) {
      var fields = config.vector.fields;
      self.config.editing.pk = config.vector.pk;
      // vado a settare aggiungere i fileds per l'editing
      _.forEach(fields, function(field) {
        self.config.editing.fields.push(field);
      })
    });
  // viene istanziato un featuresstore e gli viene associato
  // il data provider
  this._featuresStore = new FeaturesStore({
    provider: this.providers.data
  });
}

inherit(TableLayer, Layer);

var proto = TableLayer.prototype;

// funzione che restituisce i campi del layer
proto.getFields = function() {
  return this.config.editing.fields;
};

proto.getPk = function() {
  return this.config.editing.pk;
};

// funzione che restituisce l'array (configurazione) dei campi utlizzati per l'editing
proto.getEditingFields = function() {
  return this.config.editing.fields;
};

// funzione che recuprera la configurazione di editing del layer
proto.getEditingConfig = function(options) {
  options = options || {};
  var provider = this.getProvider('data');
  // ritorno la promise del provider
  return provider.getConfig(options);
};

proto.getEditingUrl = function() {
  return this.config.urls.editing;
};

proto.setEditingUrl = function(url) {
  this.config.urls.editing = url;
};

// funzione che server per settare il data url
proto.setDataUrl = function(url) {
  this.config.urls.data = url;
};

proto.getDataUrl = function() {
  return this.config.urls.data;
};

// url dedicato a ricevere la struttura del layer
proto.getConfigUrl = function() {
  return this.config.urls.config;
};

proto.setConfigUrl = function(url) {
  this.config.urls.config = url;
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

// la funzione che permette di settare il source delle features
// di default è il featuresstore che istanzia al momento in cui
// viene creato il layer
proto.setSource = function(source) {
  this.setFeaturesStore(source);
};

//funzione che va a sostiuire le features al featuresstore del layer
proto._setFeatures = function(features) {
  this._featuresStore.setFeatures(features);
};

proto.addFeatures = function(features) {
  var self = this;
  _.forEach(features, function(feature) {
    self.addFeature(feature);
  });
};

//metodo che ha lo scopo di aggiungere la feature all featuresstore del layer
proto._addFeature = function(feature) {
  this._featuresStore.addFeature(feature);
};

proto._deleteFeature = function(feature) {
  var featureId = feature.getId();
};

proto._updateFeature = function(feature) {

};

proto._clearFeatures = function() {
  this._featuresStore.clearFeatures();
};

// funzione che server per associare
proto.getFieldsWithValues = function(obj) {
  var self = this;
  // clono i fields in quanto non voglio modificare i valori originali
  var fields = _.cloneDeep(this.getFields());
  var feature, attributes;
  // il metodo accetta sia feature che fid
  if (obj instanceof Feature){
    feature = obj;
  }
  else if (obj){
    feature = this.getFeatureById(obj);
  }
  // se c'è una feature ne prendo le proprietà
  if (feature) {
    attributes = feature.getProperties();
  }
  _.forEach(fields, function(field){
    if (feature){
      if (!this._PKinAttributes && field.name == self.config.editing.pk) {
        if (feature.isNew()) {
          field.value = null;
        } else {
          field.value = feature.getPk();
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

//Metodi legati alle relazioni
proto._createRelations = function(projectRelations) {
  var relations = [];
  var layerId = this.getId();
  _.forEach(projectRelations, function(relation) {
    if ([relation.referencedLayer, relation.referencingLayer].indexOf(layerId) != -1)
      relations.push(relation);
  });
  if (!!relations.length) {
    this._relations = new Relations({
      relations: relations
    });
  }
};

// restituisce tutte le relazioni legati a quel layer
proto.getRelations = function() {
  return this._relations
};

//restituisce gli attributi fields di una deterninata relazione
proto.getRelationAttributes = function(relationName) {
  var fields = [];
  _.forEach(this._relations, function(relation) {
    if (relation.name == relationName) {
      fields = relation.fields;
      return false
    }
  });
  return fields;
};

// retituisce un oggetto contenente nome relazione e fileds(attributi) associati
proto.getRelationsAttributes = function() {
  var fields = {};
  _.forEach(this.state.relations, function(relation) {
    fields[relation.name] = relation.fields;
  });
  return fields;
};

// metodo che restituisce true o false se il layer è figlio
proto.isChild = function() {
  if (!this.getRelations())
    return false;
  return this._relations.isChild(this.getId());
};

// metodo che restituisce true o false se il layer è padre
proto.isFather = function() {
  if (!this.getRelations())
    return false;
  return this._relations.isFather(this.getId());
};

// ritorna i figli sono dopo che è stato verificato che è un padre
proto.getChildren = function() {
  if (!this.isFather())
    return [];
  return this._relations.getChildren(this.getId());
};

// ritorna i padri dopo aver verificato che è un figlio
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