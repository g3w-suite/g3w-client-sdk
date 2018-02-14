const inherit = require('core/utils/utils').inherit;
const base = require('core/utils//utils').base;
const G3WObject = require('core/g3wobject');
const Filter = require('core/layers/filter/filter');
const ProviderFactory = require('core/layers/providers/providersfactory');

// Base Class of all Layer
function Layer(config) {
  config = config || {};
  const ProjectsRegistry = require('core/project/projectsregistry');
  ProjectsRegistry.onafter('setCurrentProject', (project) => {
    const projectType = project.getType();
    const projectId = project.getId();
    const suffixUrl = projectType + '/' + projectId + '/' + config.id + '/';
    this.config.urls.data = initConfig.vectorurl + 'data/' + suffixUrl;
  });
  // static configuration of layer
  // merging all common attributes
  this.config = _.merge({
    id: config.id || 'Layer' ,
    title: config.title  || null,
    name: config.name || null,
    origname: config.origname || null,
    capabilities: config.capabilities || null,
    editops: config.editops || null,
    infoformat: config.infoformat || null,
    servertype: config.servertype || null,
    source: config.source || null,
    geolayer: false,
    fields: config.fields || {},
    urls: {
      query: config.infourl && config.infour != '' || config.wmsUrl
    }
  }, config);

  // dinamic layer values
  //this.state = config; //catalog reactive
  this.state = {
    id: config.id,
    title: config.title,
    selected: config.selected | false,
    disabled: config.disabled | false,
    hidden: config.hidden || false,
    openattributetable: this.canShowTable()
  };
  // server type
  const serverType = this.config.servertype;
  // source layer
  const sourceType = this.config.source ? this.config.source.type : null ;
  // refferred to (layersstore);
  this._layersstore = config.layersstore || null;
  /*
    Providers that layer can use

    Three type of provider:
      1 - query
      2 - filter
      3 - data -- raw data del layer (editing)
   */
  if (serverType && sourceType) {
    this.providers = {
      query: ProviderFactory.build('query', serverType, sourceType, {
        layer: this
      }),
      filter: ProviderFactory.build('filter', serverType, sourceType, {
        layer: this
      }),
      search: ProviderFactory.build('search', serverType, sourceType, {
        layer: this
      }),
      data: ProviderFactory.build('data', serverType, sourceType, {
        layer: this
      })
    };
  }
  base(this);
}

inherit(Layer, G3WObject);

const proto = Layer.prototype;

proto.getDataTable = function() {
  let provider;
  const d = $.Deferred();
  if (this.isFilterable()) {
    provider = this.getProvider('filter');
    const filter = new Filter();
    filter.getAll();
    provider.query({
      filter: filter
    })
      .done((response) => {
        const data = provider.digestFeaturesForLayers(response.data);
        const dataTableObject = {
          headers: data[0].attributes,
          features: data[0].features,
          title: this.getTitle()
        };
        d.resolve(dataTableObject)
      })
      .fail((err) => {
        d.reject(err)
      })
  } else {
    provider = this.getProvider('data');
    provider.getFeatures({
      editing:false
    })
      .done((response) => {
        let pkProperties;
        const data = response.data;
        let attributes, features;
        if (this.getType() == 'table') {
          features = data.map((feature) => {
            return {
              properties: feature
            }
          });
          attributes = this.getAttributes();
        } else {
          pkProperties = this.getFields().find((field) => response.pk == field.name);
          features = data.features;
          attributes = [pkProperties].concat(provider._parseAttributes(this.getAttributes(), data.features[0].properties));
        }
        const dataTableObject = {
          headers: attributes,
          features: features,
          title: this.getTitle()
        };
        d.resolve(dataTableObject)
      })
      .fail((err) => {
        d.reject(err)
      })
  }
  return d.promise();
};

// search method
proto.search = function(options) {
  options = options || {};
  const d = $.Deferred();
  const provider = this.getProvider('search');
  if (provider) {
    provider.query(options)
      .done(function(response) {
        d.resolve(response);
      })
      .fail(function(err) {
        d.reject(err);
      });
  } else {
    d.reject('Il layer non è searchable');
  }
  return d.promise();
};

//Info from layer (only for querable layers)
proto.query = function(options) {
  options = options || {};
  const d = $.Deferred();
  let provider = this.getProvider('query');
  // in case filter
  if (options.filter) {
    provider = this.providers.filter;
  }
  // if is intanced provider
  if (provider) {
    provider.query(options)
      .done(function(response) {
        d.resolve(response);
      })
      .fail(function(err) {
        d.reject(err);
      });
  } else {
    d.reject('Il layer non è interrogabile');
  }
  return d.promise();
};

proto.getFields = function() {
  return this.config.fields
};

proto.getProject = function() {
  return this.config.project;
};

proto.getConfig = function() {
  return this.config;
};

proto.getState = function() {
  return this.state;
};

proto.getEditingLayer = function() {
  return this;
};

proto.isHidden = function() {
  return this.state.hidden;
};

proto.setHidden = function(bool) {
  this.state.hidden = _.isBoolean(bool) ? bool: true;
};

proto.isModified = function() {
  return this.state.modified;
};

proto.getId = function() {
  return this.config.id;
};

proto.getTitle = function() {
  return this.config.title;
};

proto.getName = function() {
  return this.config.name;
};

proto.getOrigName = function() {
  return this.config.origname;
};

proto.getServerType = function() {
  if (this.config.servertype && this.config.servertype != '') {
    return this.config.servertype;
  }
  else {
    return ServerTypes.QGIS;
  }
};

proto.getType = function() {
  return this.type;
};

proto.setType = function(type) {
  this.type = type;
};

proto.isSelected = function() {
  return this.state.selected;
};

proto.isDisabled = function() {
  return this.state.disabled;
};

proto.isVisible = function() {
  return this.state.visible;
};

proto.setVisible = function(bool) {
  this.state.visible = bool;
};
proto.isQueryable = function() {
  let queryEnabled = false;
  const queryableForCababilities = !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.QUERYABLE));
  // if querable check if is visible or disabled
  if (queryableForCababilities) {
       queryEnabled = (this.isVisible() && !this.isDisabled());
    if (!_.isUndefined(this.config.infowhennotvisible) && (this.config.infowhennotvisible === true)) {
      queryEnabled = true;
    }
  }
  return queryEnabled;
};

proto.isFilterable = function() {
  return !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.FILTERABLE));
};

proto.isEditable = function() {
  return !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.EDITABLE));
};

proto.isBaseLayer = function() {
  return this.config.baselayer;
};

// get url by type ( data, editing..etc..)
proto.getUrl = function(type) {
  return this.config.urls[type];
};

// return urls
proto.getUrls = function() {
  return this.config.urls;
};

proto.getQueryUrl = function() {
  return this.config.urls.query;
};

proto.setQueryUrl = function(queryUrl) {
  this.config.urls.query = queryUrl;
};

proto.getQueryLayerName = function() {
  let queryLayerName;
  if (this.config.infolayer && this.config.infolayer != '') {
    queryLayerName = this.config.infolayer;
  }
  else {
    queryLayerName = this.config.name;
  }
  return queryLayerName;
};

proto.getQueryLayerOrigName = function() {
  let queryLayerName;
  if (this.state.infolayer && this.config.infolayer != '') {
    queryLayerName = this.config.infolayer;
  }
  else {
    queryLayerName = this.config.origname;
  }
  return queryLayerName;
};

proto.getInfoFormat = function(ogcService) {
  if (this.config.infoformat && this.config.infoformat != '' && ogcService !='wfs') {
    return this.config.infoformat;
  }
  else {
    return 'application/vnd.ogc.gml';
  }
};

proto.setInfoFormat = function(infoFormat) {
  this.state.infoformat = infoFormat;
};

proto.getAttributes = function() {
  return this.config.fields;
};

proto.changeAttribute = function(attribute, type, options) {
  this.config.fields.forEach((field) => {
    if (field.name == attribute) {
      field.type = type;
      field.options = options;
    }
  })
};

proto.getAttributeLabel = function(name) {
  let label;
  this.getAttributes().forEach((field) => {
    if (field.name == name){
      label = field.label;
    }
  });
  return label;
};

proto.getProvider = function(type) {
  return this.providers[type];
};

proto.getProviders = function() {
  return this.providers;
};

proto.getLayersStore = function() {
  return this._layersstore;
};

proto.setLayersStore = function(layerstore) {
  this._layersstore = layerstore;
};

proto.canShowTable = function() {
  if (this.getServerType() == 'QGIS') {
    if([Layer.SourceTypes.POSTGIS, Layer.SourceTypes.SPATIALITE].indexOf(this.config.source.type) > -1) {
      return true
    }
  }
  return false
};


/// LAYER PROPERTIES

// Layer Types
Layer.LayerTypes = {
  TABLE: "table",
  IMAGE: "image",
  VECTOR: "vector"
};

// Server Types
Layer.ServerTypes = {
  OGC: "OGC",
  QGIS: "QGIS",
  Mapserver: "Mapserver",
  Geoserver: "Geoserver",
  ArcGIS: "ArcGIS",
  OSM: "OSM",
  Bing: "Bing",
  Local: "Local"
};

// Source Types
Layer.SourceTypes = {
  POSTGIS: 'postgres',
  SPATIALITE: 'spatialite',
  CSV: 'delimitedtext',
  WMS: 'wms'
};

// Layer Capabilities
Layer.CAPABILITIES = {
  QUERYABLE: 1,
  FILTERABLE: 2,
  EDITABLE: 4
};

//Editing types
Layer.EDITOPS = {
  INSERT: 1,
  UPDATE: 2,
  DELETE: 4
};


module.exports = Layer;
