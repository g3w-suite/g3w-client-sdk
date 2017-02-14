var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      state: null
    }
  },
  mounted: function() {
    var self = this;
    this.state.loading = true;
    this.$nextTick(function(){
      $('#pdf').load(function(){
        self.state.loading = false;
      })
    });
  }
});

var PrintPage = function(options) {
  base(this);
  var options = options || {};
  var service = options.service;
  // istanzio il componente interno
  this.setService(service);
  var internalComponent = new InternalComponent();
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state;
  this.unmount = function() {
    var baseUnMount = base(this, 'unmount');
    service._enableDisablePrintButton(false);
    return baseUnMount;
  }
};

inherit(PrintPage, Component);


module.exports = PrintPage;


