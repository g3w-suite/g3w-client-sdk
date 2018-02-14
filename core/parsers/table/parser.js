const TableParser = function() {
  var pk;
  this.get = function(options) {
    options = options || {};
    const type = options.type;
    const pk = options.pk || 'id';
    let parser;
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
    const features = [];
    let feature;
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

