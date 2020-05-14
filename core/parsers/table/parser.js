const Feature = require('core/layers/features/feature');
const TableParser = function() {
  this.pk = 'id';
  this.get = function(options={}) {
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

  this._parserJSON = function(data={}) {
    const {features=[]} = data;
    return features.map(_feature => {
      const {properties} = _feature;
      const feature = new Feature({
        pk: this.pk
      });
      //set properties
      feature.setProperties(properties);
      //set Id prporties (is pk)
      feature.setId(properties[this.pk]);
      return feature;
    });
  }
};

module.exports = new TableParser();

