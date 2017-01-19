var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./streetview.html'),
  data: function() {
    return {
      state: null
    }
  },
  mounted: function() {
    var self = this;
    this.$nextTick(function() {
      var position = self.$options.service.getPosition();
      self.$options.service.postRender(position);
    });
  }
});

var StreetViewComponent = function(options) {
  base(this);
  var options = options || {};
  var service = options.service;
  // istanzio il componente interno
  this.setService(service);
  var internalComponent = new InternalComponent({
    service: service
  });
  this.setInternalComponent(internalComponent);
  this.unmount = function() {
    return base(this, 'unmount');
  }
};

inherit(StreetViewComponent, Component);


module.exports = StreetViewComponent;


