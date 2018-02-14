const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const TableService = require('../tableservice');

const Link = {
  template: '<a :href="href" target="_blank"><i class="glyphicon glyphicon-link"></i></a>',
  props: ['href']
}

const InternalComponent = Vue.extend({
  template: require('./table.html'),
  data: function() {
    return {
      state: null
    }
  },
  components: {
    'link-item': Link
  },
  methods: {
    _setLayout: function() {
      this.$options.service._setLayout();
    },
    zoomAndHighLightSelectedFeature: function(feature, zoom=true) {
      if (this.state.geometry)
        this.$options.service.zoomAndHighLightSelectedFeature(feature, zoom);
    },
    getValueObjectFromAttribute: function(feature, attribute)  {
      return this.$options.service.getValueObjectFromAttribute(feature, attribute)
    }
  },
  mounted: function() {
    this.$nextTick(() => {
      const tableHeight = $(".content").height();
      const scrollX = $('#layer_attribute_table thead').width() > $(".content").width()
      $('#open_attribute_table table').DataTable( {
        "pageLength": 10,
        "bLengthChange": false,
        "scrollX": scrollX,
        "scrollY": tableHeight / 2 +  "px",
        "scrollCollapse": true,
        "order": [ 0, 'asc' ]
      } )
    });
  }
});

const TableComponent = function(options) {
  base(this);
  this.id = "openattributetable";
  options = options || {};
  const headers = options.headers || [];
  const title = options.title || 'Attributes';
  const features = options.features || [];
  const service = options.service || new TableService({
    features: features,
    title: title,
    headers: headers
  });

  this.setService(service);
  const internalComponent = new InternalComponent({
    service: service,
    headers: headers
  });
  this.setInternalComponent(internalComponent);
  internalComponent.state = service.state;
  this.layout = function() {
    this.getService()._setLayout();
  };
};

inherit(TableComponent, Component);


module.exports = TableComponent;


