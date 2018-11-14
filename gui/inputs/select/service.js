const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const getAppLanguage = require('core/i18n/i18n.service').getAppLanguage;
const CatalogLayersStoresRegistry = require('core/catalog/cataloglayersstoresregistry');
var Service = require('gui/inputs/service');

function SelectService(options) {
  options = options || {};
  base(this, options);
  this.layer = null;
}

inherit(SelectService, Service);

var proto = SelectService.prototype;

proto._getLayerById = function(layer_id) {
  return CatalogLayersStoresRegistry.getLayerById(layer_id);
};

proto.getLanguage = function() {
  return getAppLanguage();
};

proto.getData = function({layer_id, value, key, search} = {}) {
  const search_value = `${key}_${search}`;
  return new Promise((resolve, reject) => {
    if (!this._layer) {
      this._layer = this._getLayerById(layer_id);
    }
    this._layer.getDataTable({
      suggest: search_value
    }).then((response) => {
      const values = [];
      const features = response.features;
      for (let i=0; i < features.length; i++) {
        values.push({
          text:features[i].properties[key],
          id: i,
          $value: features[i].properties[value]
        })
      }
      resolve(values);
    }).fail((err) => {
      reject(err);
    })
  });
};

module.exports = SelectService;
