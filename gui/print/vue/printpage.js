const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');

const InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      state: null
    }
  },
  mounted: function() {
    this.$nextTick(() => {
      this.state.loading = true;
      $('#pdf').load(() => {
        this.state.loading = false;
      })
    });
  }
});

const PrintPage = function(options) {
  base(this);
  options = options || {};
  const service = options.service;
  // istanzio il componente interno
  this.setService(service);
  const internalComponent = new InternalComponent();
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state;
};

inherit(PrintPage, Component);


module.exports = PrintPage;


