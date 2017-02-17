var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');
var Service = require('../photoservice');

var InternalComponent = Vue.extend({
  template: require('./photo.html'),
  data: function() {
    return {
      state: null,
      url: this.$options.url
    }
  }
});

var PhotoComponent = function(options) {
  base(this);
  var options = options || {};
  var service = options.service || new Service({});
  var url = options.url || null;
  // istanzio il componente interno
  this.setService(service);
  var internalComponent = new InternalComponent({
    service: service,
    url: url
  });
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state;
};

inherit(PhotoComponent, Component);


module.exports = PhotoComponent;


