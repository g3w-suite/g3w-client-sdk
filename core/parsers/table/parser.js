var TableParser = function() {
  var pk;
  // funzione che permette di recuprarer il parser addatto alla richiesta
  this.get = function(options) {
    options = options || {};
    var type = options.type;
    pk = options.pk || 'id';
    var parser;
    switch (type) {
      case 'json':
        parser = this._parserJSON;
        break;
      default: 
        parser = this._parserJSON;
    }
    return parser;
  };
  
  this._parserJSON = function(data) {
    var features = [];
    var feature;
    _.forEach(data, function(properties) {
      feature = new ol.Feature();
      //vado a settare le proprietà
      feature.setProperties(properties);
      //vado a settare l'id univoco della feature
      feature.setId(properties[pk]);
      features.push(feature)
    });
    return features;
  }
};

module.exports = new TableParser();

