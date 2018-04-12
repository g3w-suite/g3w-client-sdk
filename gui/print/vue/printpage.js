const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');

const InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      state: null,
      showdownloadbutton: false
    }
  },
  methods: {
    downloadImage() {
      xhr = new XMLHttpRequest();
      xhr.open("GET", this.state.url);
      xhr.responseType = "blob";
      xhr.overrideMimeType("octet/stream");
      xhr.onload = function() {
        if (xhr.status === 200) {
          window.location = (URL || webkitURL).createObjectURL(xhr.response);
        }
      };
      xhr.send();
    }
  },
  mounted: function() {
    this.$nextTick(() => {
      this.state.loading = true;
      $('#printpage').load(() => {
        this.showdownloadbutton = this.state.format == 'jpg';
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

  this.unmount = function() {
    this.getService().setPrintAreaAfterCloseContent();
    return base(this, 'unmount')
  }
};

inherit(PrintPage, Component);


module.exports = PrintPage;


