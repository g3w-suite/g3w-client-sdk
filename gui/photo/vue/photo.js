var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./photo.html'),
  data: function() {
    return {
      state: null
    }
  }
});

var PhotoComponent = function(options) {
  base(this);
  var options = options || {};
  var service = options.service;
  // istanzio il componente interno
  this.setService(service);
  var internalComponent = new InternalComponent({
    service: service
  });
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state;
};

inherit(PhotoComponent, Component);


module.exports = PhotoComponent;


