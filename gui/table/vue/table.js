const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const TableService = require('../tableservice');

const InternalComponent = Vue.extend({
  template: require('./table.html'),
  data: function() {
    return {
      state: null
    }
  },
  methods: {
    _setLayout: function() {
      this.$options.service._setLayout();
    },
    zoomAndHighLightSelectedFeature: function(feature, zoom=true) {
      if (this.state.geometry)
        this.$options.service.zoomAndHighLightSelectedFeature(feature, zoom);
    },
  },
  mounted: function() {
    this.$nextTick(() => {
      const tableHeight = $(".content").height();
      $('#open_attribute_table table').DataTable( {
        "pageLength": 10,
        "bLengthChange": false,
        "scrollY": tableHeight / 2 +  "px",
        "scrollCollapse": true,
        "order": [ 0, 'asc' ],
        columnDefs: [
          { orderable: false, targets: [-1, -2] }
        ]
      } )
    });
  }
});

const TableComponent = function(options) {
  base(this);
  this.id = "openattributetable";
  options = options || {};
  const service = options.service || new TableService({
    features: options.features,
    title: options.title,
    headers: options.headers
  });
  const headers = options.headers || [];
  // istanzio il componente interno
  this.setService(service);
  const internalComponent = new InternalComponent({
    service: service,
    headers: headers
  });
  this.setInternalComponent(internalComponent);
  internalComponent.state = service.state;
  this.layout = function() {
    this.getService()._setLayout();
  }
};

inherit(TableComponent, Component);


module.exports = TableComponent;


