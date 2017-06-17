var Providers = {
  geojson: require('./geojsondataprovider'),
  kml: require('./g3wdataprovider'),
  xml: require('./kmldataprovider'),
  g3w: require('./xmldataprovider'),
  wms: require('./wmsdataprovider'),
  wfs: require('./wfsdataprovider')
};

function DataProviderFactory(type,options) {
  this.build = function(type,options) {
    // messo qui altrimenti errore nell'inheritance
    return Providers[type](options);
  };
}


module.exports = new DataProviderFactory();
