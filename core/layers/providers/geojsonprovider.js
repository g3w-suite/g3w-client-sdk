const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Provider = require('core/layers/providers/provider');

import axios from 'axios';

function GEOJSONDataProvider(config = {}) {
  this.config =  config;
  base(this, config);
  this._name = 'geojson';
}

inherit(GEOJSONDataProvider, Provider);

const proto = GEOJSONDataProvider.prototype;

proto.getFeatures = function(options) {
  const url = options.url;
  const mapProjection = options.mapProjection;
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((response) => {
        const parser = new ol.format.GeoJSON({
          featureProjection: mapProjection
        });
        const features = parser.readFeatures(response.data.results);
        resolve(features)
      })
      .catch((err) => {
        reject(err)
      })
  })
};


module.exports = GEOJSONDataProvider;

