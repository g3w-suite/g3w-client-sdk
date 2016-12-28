var inherit = require('core/utils/utils').inherit;
var G3WObject = require('core/g3wobject');
var base = require('core/utils/utils').base;

function LawService() {
  base(this);
  this.state = {
    url: null
  };
  this.getLaw = function(options) {
    var value = options.value || '';
    var delimiter = options.options.delimiter || ',';
    var api = options.options.lawurl || '';
    var parameters = value.split(delimiter);
    var law = parameters[0];
    var article = parameters[1];
    var comma = parameters[2] || '';
    // costruisco l'url del pdf
    var url = api + '?article='+article+'&comma='+comma+'&law='+law+'&format=pdf';
    this.state.url = url;
    return url;
  }
}

inherit(LawService, G3WObject);

module.exports = LawService;
