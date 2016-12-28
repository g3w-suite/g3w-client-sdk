var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');
var LawService = require('gui/law/lawservice');

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
  var service = options.service || new LawService;
  var url = service.getLaw(options);
  var internalComponent = new InternalComponent({
    url: url
  });
  this.setInternalComponent(internalComponent);
};

inherit(LawComponent, Component);


module.exports = LawComponent;


