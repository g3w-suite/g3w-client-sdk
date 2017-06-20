var Providers = {
  geojson: require('./geojsondataprovider'),
  kml: require('./kmldataprovider'),
  xml: require('./xmldataprovider'),
  qgis: require('./qgisdataprovider'),
  wms: require('./wmsdataprovider'),
  wfs: require('./wfsdataprovider')
};

function DataProviderFactory(type, options) {
  this.build = function(type,options) {
    // ritorna l'sitanza del provider selezionato
    return new Providers[type](options);
  };
}


module.exports = new DataProviderFactory();
