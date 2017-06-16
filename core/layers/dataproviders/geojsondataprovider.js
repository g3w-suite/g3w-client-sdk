var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var DataProvider = require('core/layers/dataproviders/dataprovider').DataProvider;

function GEOJSONDataProvider(options) {
  options = options || {};
  base(this);
  this._name = 'geojson';
}

inherit(GEOJSONDataProvider, DataProvider);

var proto = GEOJSONDataProvider.prototype;

proto.getFearures = function() {
  var d = $.Deferred();
  return d.promise();
};

// ottiene la configurazione del vettoriale
// (qui richiesto solo per la definizione degli input)
proto._getVectorLayerConfig = function(layerApiField) {
  var d = $.Deferred();
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

// ottiene il vettoriale in modalità  editing
proto._getVectorLayerData = function(vectorLayer, bbox) {
  var d = $.Deferred();
  var lock = this.getMode() == 'w' ? true : false;
  var apiUrl;
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

