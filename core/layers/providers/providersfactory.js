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
      filter: Providers.qgis,
      data: Providers.qgis
    },
    'spatialite': {
      query: Providers.wms,
      filter: Providers.qgis,
      data: Providers.qgis
    },
    'ogr': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: null
    },
    'wms': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: null
    },
    'wfs': {
      query: Providers.wms,
      filter: Providers.wfs,
      data: Providers.wfs
    },
    'gdal': {
      query: Providers.wms,
      filter: null,
      data: null
    }
  },
  'OGC': {
    'wms': {
      query: Providers.wms,
      filter: null,
      data: null
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
