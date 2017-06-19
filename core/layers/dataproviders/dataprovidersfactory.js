var Providers = {
  geojson: require('./geojsondataprovider'),
  kml: require('./kmldataprovider'),
  xml: require('./xmldataprovider'),
  g3w: require('./g3wdataprovider'),
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
