var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      url: this.$options.url,
      state: null
    }
  }
});

var PrintPage = function(options) {

  var options = options || {};
  var url = options.url;
  var service = options.service;
  base(this);
  // istanzio il componente interno
  var internalComponent = new InternalComponent({
    url: url
  });
  this.setInternalComponent(internalComponent);
  this.unmount = function() {
    var baseUnMount = base(this, 'unmount');
    service._clearPrintService(false);
    service.setInitialPrintArea();
    return baseUnMount;
  }
};

inherit(PrintPage, Component);


module.exports = PrintPage;


