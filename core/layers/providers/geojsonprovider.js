const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const DataProvider = require('core/layers/providers/provider');

function GEOJSONDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'geojson';
}

inherit(GEOJSONDataProvider, DataProvider);

const proto = GEOJSONDataProvider.prototype;

proto.getFearures = function() {
  const d = $.Deferred();
  return d.promise();
};

// get configuration by vector layer
proto._getVectorLayerConfig = function(layerApiField) {
  const d = $.Deferred();
  // attravercso il layer name e il base url
  // chiedo la server di inviarmi la configurazione editing del laye
  $.get(this._baseUrl+layerApiField+"/?config"+ this._customUrlParameters)
    .done(function(data) {
      d.resolve(data);
    })
    .fail(function(){
      d.reject();
    });
  return d.promise();
};

// get vector layer in editing mode
proto._getVectorLayerData = function(vectorLayer, bbox) {
  const d = $.Deferred();
  const lock = this.getMode() == 'w' ? true : false;
  let apiUrl;
  if (lock) {
    apiUrl = this._baseUrl+vectorLayer[this._editingApiField]+"/?editing";
  } else {
    apiUrl = this._baseUrl+vectorLayer[this._editingApiField]+"/?"
  }
  $.get(apiUrl + this._customUrlParameters+"&in_bbox=" + bbox[0]+","+bbox[1]+","+bbox[2]+","+bbox[3])
    .done(function(data) {
      d.resolve(data);
    })
    .fail(function(){
      d.reject();
    });
  return d.promise();
};

module.exports = GEOJSONDataProvider;

