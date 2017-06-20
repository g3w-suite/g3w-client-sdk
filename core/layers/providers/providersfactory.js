var Providers = {
  geojson: require('./geojsonprovider'),
  kml: require('./kmlprovider'),
  xml: require('./xmlprovider'),
  qgis: require('./qgisprovider'),
  wms: require('./wmsprovider'),
  wfs: require('./wfsprovider')
};

function ProviderFactory() {
  this.build = function(type, options) {
    // ritorna l'sitanza del provider selezionato
    return new Providers[type](options);
  };
}

module.exports = new ProviderFactory();
