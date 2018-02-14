const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const DataProvider = require('core/layers/providers/provider');
const Filter = require('core/layers/filter/filter');

function WFSDataProvider(options) {
  options = options || {};
  base(this, options);
  this._name = 'wfs';
  this._layerName = this._layer.getQueryLayerName().replace(/ /g,'_');
}

inherit(WFSDataProvider, DataProvider);

const proto = WFSDataProvider.prototype;

proto.getData = function() {
  const d = $.Deferred();
  return d.promise();
};

// query method
proto.query = function(options={}) {
  const filter = options.filter;
  const d = $.Deferred();
  this._doRequest(filter)
    .then((response) => {
      const featuresForLayers = this.handleQueryResponseFromServer(this._layerName, response);
      d.resolve({
        data: featuresForLayers
      });
    })
    .fail((e) => {
      d.reject(e);
    });
  return d.promise();
};

proto._post = function(url, params) {
  url = url + '/';
  return  $.post(url, params)

};

// get request
proto._get = function(url, params) {
  // trasform parameters
  const urlParams = $.param(params);
  url = url + '?' + urlParams;
  return $.get(url)
};

//request to server
proto._doRequest = function(filter) {
  filter = filter || new Filter();
  const layer = this._layer;
  const url = layer.getQueryUrl();
  const crs = layer.getProjection().getCode();
  const infoFormat = layer.getInfoFormat();

  const params = {
    SERVICE: 'WFS',
    VERSION: '1.3.0',
    REQUEST: 'GetFeature',
    TYPENAME: this._layerName,
    OUTPUTFORMAT: infoFormat,
    SRSNAME:  crs
  };
  if (filter) {
    const filterType = filter.getType();
    let featureRequest;
    const f = ol.format.filter;
    filter = filter.get();
    switch (filterType) {
      case 'bbox':
        featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: f.bbox('the_geom', filter)
        });
        break;
      case 'geometry':
        featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: f.intersects('the_geom', filter)
        });
        break;
      case 'expression':
        featureRequest = new ol.format.WFS().writeGetFeature({
          featureTypes: [layer],
          filter: null
        });
        break;
      case 'all':
        request = this._post(url, params);
        return request;
      default:
        break;
    }
    params.FILTER = featureRequest.children[0].innerHTML;
    request = this._post(url, params);
    return request;
  }
};


module.exports = WFSDataProvider;
