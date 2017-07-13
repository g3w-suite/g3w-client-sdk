var Providers = {
  geojson: require('./geojsonprovider'),
  kml: require('./kmlprovider'),
  xml: require('./xmlprovider'),
  qgis: require('./qgisprovider'),
  wms: require('./wmsprovider'),
  wfs: require('./wfsprovider')
};

var ProvidersForServerTypes = {
  'QGIS': {
    'postgres': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: Providers.qgis,
      search: Providers.qgis
    },
    'spatialite': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: Providers.qgis,
      search: Providers.qgis
    },
    'ogr': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: null,
      search: Providers.qgis
    },
    'delimitedtext': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: null,
      search: null
    },
    'wms': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: null,
      search: null
    },
    'wfs': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: Providers.wfs,
      search: Providers.qgis
    },
    'gdal': {
      query: Providers.wms,
      filter: null,
      data: null,
      search: null
    }
  },
  'OGC': {
    'wms': {
      query: Providers.wms,
      filter: null,
      data: null,
      search: null
    }
  }
};

function ProviderFactory() {
  this.build = function(providerType,serverType,sourceType,options) {
    // ritorna l'sitanza del provider selezionato
    var providerClass = this.get(providerType,serverType,sourceType);
    if (providerClass) {
      return new providerClass(options);
    }
    return null;
  };

  this.get = function(providerType,serverType,sourceType) {
    return ProvidersForServerTypes[serverType][sourceType][providerType];
  }
}

module.exports = new ProviderFactory();
