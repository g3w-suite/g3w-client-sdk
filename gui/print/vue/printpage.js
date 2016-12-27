var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');

var InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      url: null
    }
  }
});

var PrintPage = function(options) {
  base(this);
  var options = options || {};
  var service = options.service;
  // istanzio il componente interno
  var internalComponent = new InternalComponent();
  this.setInternalComponent(internalComponent);
  this.unmount = function() {
    var baseUnMount = base(this, 'unmount');
    service._enableDisablePrintButton(false);
    return baseUnMount;
  }
};

inherit(PrintPage, Component);


module.exports = PrintPage;


