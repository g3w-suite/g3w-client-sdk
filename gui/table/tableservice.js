const GUI = require('gui/gui');
const t = require('core/i18n/i18n.service').t;
const coordinatesToGeometry =  require('core/utils/geo').coordinatesToGeometry;

const TableService = function(options = {}) {
  this.currentPage = 0; // number of pages
  this.layer = options.layer;
  const headers = this.getHeaders(this.layer.getTableFields());
  this.projection = this.layer.state.geolayer  ? this.layer.getProjection() : null;
  this.state = {
    pageLengths: [10, 25, 50],
    features: [],
    title: this.layer.getTitle(),
    headers,
    geometry: true,
    loading: false,
    allfeatures: 0,
    featurescount: 0,
    pagination: true,
    hasGeometry: false
  };
};

const proto = TableService.prototype;

proto.getHeaders = function(fields) {
  const headers = fields.filter((field) => {
    return  ['boundedBy', 'geom','the_geom','geometry','bbox', 'GEOMETRY'].indexOf(field.name) == -1
  });
  return headers;
};

// function need to work with pagination
proto.setDataForDataTable = function() {
  const data = [];
  this.state.features.forEach((feature) => {
    const attributes = feature.attributes ? feature.attributes : feature.properties;
    const values = [];
    this.state.headers.forEach((header) => {
      values.push(attributes[header.name]);
    });
    data.push(values)
  });
  return data;
};

proto.getData = function({start = 0, order = [], length = this.state.pageLengths[0], search={value:null}} = {}) {
  // reset features before load
  const d = $.Deferred();

  if (!this.state.headers.length)
    d.resolve({
      data: [],
      recordsTotal: 0,
      recordsFiltered: 0
    });
  else {
    let searchText = search.value && search.value.length > 0 ? search.value : null;
    this.state.features.splice(0, this.state.features.length);
    if (!order.length) {
      order.push({
        column: 0,
        dir: 'asc'
      })
    }
    const ordering = order[0].dir == 'asc' ? this.state.headers[order[0].column].name : '-'+this.state.headers[order[0].column].name;
    this.currentPage = start == 0  ? 1 : (start/length) + 1;
    this.layer.getDataTable({
      page: this.currentPage,
      page_size: length,
      search: searchText,
      ordering
    }).then((data) => {
      let features = data.features;
      this.addFeatures(features);
      this.state.pagination = !!data.count;
      this.state.allfeatures = data.count || this.state.features.length;
      this.state.featurescount += features.length;
      d.resolve({
        data: this.setDataForDataTable(),
        recordsFiltered: this.state.allfeatures,
        recordsTotal: this.state.allfeatures
      });
    })
      .fail((err) => {
        GUI.notify.error(t("info.server_error"));
        d.reject(err);
      });
  }

  return d.promise();
};

proto.addFeature = function(feature) {
  const tableFeature = {
    attributes: feature.attributes ? feature.attributes : feature.properties,
    geometry: this._returnGeometry(feature)
  };
  this.state.features.push(tableFeature);
};

proto.addFeatures = function(features) {
  this.state.hasGeometry = this.hasGeometry(features);
  this._addPkProperties(features);
  features.forEach((feature) => {
    this.addFeature(feature);
  });
};

proto._setLayout = function() {
  //TODO
};

proto._returnGeometry = function(feature) {
  let geometry;
  if (feature.attributes) {
    geometry = feature.geometry;
  } else if (feature.geometry) {
    geometry = coordinatesToGeometry(feature.geometry.type, feature.geometry.coordinates);
  }
  return geometry;
};

proto.hasGeometry = function(features) {
  if (features.length) {
    return !!features[0].geometry
  }
  return false
};

proto._addPkProperties = function(features) {
  features.forEach((feature) => {
    if (!feature.attributes && feature.id)
      feature.properties[this.state.headers[0].name] = feature.id;
  })
};

proto.zoomAndHighLightSelectedFeature = function(feature, zoom=true) {
  let geometry = feature.geometry;
  if (geometry) {
    const mapService = GUI.getComponent('map').getService();
    mapService.highlightGeometry(geometry , {
      zoom
    });
  }
};


module.exports = TableService;
