const inherit = require('core/utils/utils').inherit;
const imageToDataURL = require('core/utils/utils').imageToDataURL;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');

const InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      state: null,
      showdownloadbutton: false,
      jpegimageurl: null
    }
  },
  watch: {
    'state.url': function(url) {
      if (url) {
        $('#printpage').load(url, (response, status) => {
          this.$options.service.stopLoading();
          if (status === 'error') {
            this.$options.service.showError();
          } else {
            if (this.state.format == 'jpg') {
              imageToDataURL({
                src: this.state.url,
                callback: (url) => {
                  this.showdownloadbutton = true;
                  this.jpegimageurl = url;
                }
              })
            }
          }
        });
      }
    }
  },
  mounted: function() {
    this.$options.service.startLoading();
    this.$nextTick(() => {});
  }
});

const PrintPage = function(options) {
  base(this);
  options = options || {};
  const service = options.service;
  // istanzio il componente interno
  this.setService(service);
  const internalComponent = new InternalComponent({
    service: service
  });
  this.setInternalComponent(internalComponent);
  this.internalComponent.state = service.state;
  this.unmount = function() {
    this.getService().setPrintAreaAfterCloseContent();
    return base(this, 'unmount')
  }
};

inherit(PrintPage, Component);


module.exports = PrintPage;


