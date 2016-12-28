var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./law.html'),
  data: function() {
    return {
      url: this.$options.url
    }
  }
});

var LawComponent = function(options) {
  base(this);
  var options = options || {};
  var value = options.value || '';
  var delimiter = options.options.delimiter || ',';
  var api = options.options.lawurl || '';
  var parameters = value.split(delimiter);
  // costruisco l'url del pdf
  var url = api + '/?article='+parameters[1]+'&comma='+parameters[2]+'&law='+parameters[0]+'&format=pdf';
  var internalComponent = new InternalComponent({
    url: url
  });
  this.setInternalComponent(internalComponent);
};

inherit(LawComponent, Component);


module.exports = LawComponent;


