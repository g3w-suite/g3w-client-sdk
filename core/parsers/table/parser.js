const TableParser = function() {
  this.pk = 'id';
  this.get = function(options) {
    options = options || {};
    const type = options.type;
    this.pk = options.pk || this.pk;
    let parser;
    switch (type) {
      case 'json':
        parser = this._parserJSON.bind(this);
        break;
      default:
        parser = this._parserJSON.bind(this);
    }
    return parser;
  };

  this._parserJSON = function(data) {
    const features = [];
    let feature;
    _.forEach(data, (properties) => {
      feature = new ol.Feature();
      //set properties
      feature.setProperties(properties);
      //set Id prporties (is pk)
      feature.setId(properties[this.pk]);
      features.push(feature)
    });
    return features;
  }
};

module.exports = new TableParser();

