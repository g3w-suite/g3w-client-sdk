var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');
var LawService = require('gui/law/lawservice');

var InternalComponent = Vue.extend({
  template: require('./law.html'),
  data: function() {
    return {
     state: null
    }
  }
});

var LawComponent = function(options) {
  base(this);
  var options = options || {};
  var service = options.service || new LawService;
  this.setService(service);
  var internalComponent = new InternalComponent;
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state
};

inherit(LawComponent, Component);


module.exports = LawComponent;


