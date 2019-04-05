const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const XHR = require('core/utils/utils').XHR;
const G3WObject = require('core/g3wobject');
const Filter = require('core/layers/filter/filter');
const ProviderFactory = require('core/layers/providers/providersfactory');

// Base Class of all Layer
function Layer(config = {}) {
  const ProjectsRegistry = require('core/project/projectsregistry');
  ProjectsRegistry.onafter('setCurrentProject', (project) => {
    const projectType = project.getType();
    const projectId = project.getId();
    const suffixUrl = `${projectType}/${projectId}/${config.id}/`;
    const vectorUrl = initConfig.vectorurl;
    this.config.urls.data = `${vectorUrl}data/${suffixUrl}`;
    this.config.urls.shp = `${vectorUrl}shp/${suffixUrl}`;
  });
  // assign some attribute
  config.id = config.id || 'Layer';
  config.title = config.title || config.name;
  config.download = !!config.download;
  config.geolayer = false;
  config.baseLayer =  false;
  config.fields = config.fields || {};
  config.urls = config.urls || {
    query: config.infourl && config.infourl !== '' ? config.infourl : config.wmsUrl
  };
  this.config = config;
  // dinamic layer values
  this.state = {
    id: config.id,
    title: config.title,
    selected: config.selected | false,
    disabled: config.disabled | false,
    metadata: config.metadata,
    metadata_querable: this.isQueryable({onMap:false}),
    openattributetable: this.canShowTable(),
    removable: config.removable || false,
    source: config.source
  };

  this._editingLayer = null;
  // refferred to (layersstore);
  this._layersstore = config.layersstore || null;
  /*
    Providers that layer can use

    Three type of provider:
      1 - query
      2 - filter
      3 - data -- raw data del layer (editing)
   */
  // server type
  const serverType = this.config.servertype;
  // source layer
  const sourceType = this.config.source ? this.config.source.type : null;
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

proto.getShp = function() {
  const url = this.getUrl('shp');
  return XHR.fileDownload({
    url,
    httpMethod: "GET"
  })
};

proto.getDataTable = function({ page = null, page_size=null, ordering=null, search=null, suggest=null } = {}) {
  const d = $.Deferred();
  let provider;
  const params = {
    page,
    page_size,
    ordering,
    search,
    suggest
  };
  if (!(this.getProvider('filter')  || this.getProvider('data'))) {
   d.reject();
  } else {
    if (this.getServerType() == 'QGIS' && [Layer.SourceTypes.POSTGIS,Layer.SourceTypes.SPATIALITE].indexOf(this.config.source.type) != -1) {
      provider = this.getProvider('data');
      provider.getFeatures({editing: false}, params)
        .done((response) => {
          let pkProperties;
          const data = response.data;
          const count = response.count;
          const title = this.getTitle();
          let headers, features;
          if (this.getType() === 'table') {
            features = data.map((feature) => {
              return {
                properties: feature
              }
            });
            headers = this.getAttributes();
          } else if (this.get('source').type === 'geojson') {
            const data = provider.digestFeaturesForLayers([{
              layer: this,
              features: response
            }]);
            headers = data[0].attributes;
            features = data[0].features;
          } else {
            pkProperties = this.getFields().find((field) => ((response.pk === field.name) && field.show));
            features = data.features;
            headers = features.length ? features[0].properties : [];
            headers = provider._parseAttributes(this.getAttributes(), headers);
            if (pkProperties)
              headers.unshift(pkProperties);
          }
          const dataTableObject = {
            pk: !!pkProperties,
            headers,
            features,
            title,
            count
          };
          d.resolve(dataTableObject)
        })
        .fail((err) => {
          d.reject(err)
        })
    } else if (this.isFilterable()) {
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
      d.reject()
    }
  }

  return d.promise();
};

// search method
proto.search = function(options={}) {
  // check option feature_count
  options.feature_count = options.feature_count || 10;
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
proto.query = function(options={}) {
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

// generel way to get an attribute
proto.get = function(property) {
  return this.config[property] ? this.config[property] : this.state[property];
};

proto.getFields = function() {
  return this.config.fields
};

proto.getEditingFields = function() {
  return this.config.editing.fields;
};

proto.getTableFields = function() {
  return this.config.fields.filter((field) => {
    return field.show
  })
};

proto.getProject = function() {
  return this.config.project;
};

proto.getConfig = function() {
  return this.config;
};

proto.getEditorFormStructure = function() {
  return this.config.editor_form_structure ? this.config.editor_form_structure.filter((structure) => {
    return !structure.field_name;
  }) : this.config.editor_form_structure;
};

proto.getFieldsOutOfFormStructure = function() {
  return this.config.editor_form_structure ? this.config.editor_form_structure.filter((structure) => {
    return structure.field_name;
  }) : []
};

proto.hasFormStructure = function() {
  return !!this.config.editor_form_structure;
};

proto.getState = function() {
  return this.state;
};

proto.getSource = function() {
  return this.state.source;
};

proto.getSourceType = function() {
  return this.state.source ? this.state.source.type : null;
};

proto.isShpDownlodable = function() {
  return this.config.download;
};


proto.getEditingLayer = function() {
  return this._editingLayer;
};

proto.setEditingLayer = function(editingLayer) {
  this._editingLayer = editingLayer;
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

proto.getMetadata = function() {
  return this.state.metadata
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

proto.isType = function(type) {
  return this.getType() === type;
};

proto.setType = function(type) {
  this.type = type;
};

proto.isSelected = function() {
  return this.state.selected;
};

proto.setSelected = function(bool) {
  this.state.selected = bool;
};

proto.setDisabled = function(bool) {
  this.state.disabled = bool
};

proto.isDisabled = function() {
  return this.state.disabled;
};

proto.isVisible = function() {
  return this.state.visible && !this.isDisabled();
};

proto.setVisible = function(bool) {
  this.state.visible = bool;
};

// set a parametre map to check if request from map point of view or just a capabilities info layer
proto.isQueryable = function({onMap} = {onMap:false}) {
  let queryEnabled = false;
  const queryableForCababilities = !!(this.config.capabilities && (this.config.capabilities & Layer.CAPABILITIES.QUERYABLE));
  if (!onMap) {
    return queryableForCababilities;
  }
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
  for (const field of this.config.fields) {
    if (field.name == attribute) {
      field.type = type;
      field.options = options;
    }
  }
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
  if (this.getServerType() === 'QGIS') {
    if( ([Layer.SourceTypes.POSTGIS, Layer.SourceTypes.SPATIALITE].indexOf(this.config.source.type) > -1) && this.isQueryable()) {
      return true
    }
  } else if (this.getServerType() === 'G3WSUITE') {
      if (this.get('source').type == "geojson")
        return true
  } else if (this.isFilterable())
    return true;
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
  BING: "Bing",
  LOCAL: "Local",
  TMS: "TMS",
  WMTS: "WMTS",
  G3WSUITE: "G3WSUITE"

};

// Source Types
Layer.SourceTypes = {
  POSTGIS: 'postgres',
  SPATIALITE: 'spatialite',
  CSV: 'delimitedtext',
  OGR: 'ogr',
  WMS: 'wms',
  GEOJSON: "geojson"
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
