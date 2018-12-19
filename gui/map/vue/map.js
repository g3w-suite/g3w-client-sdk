const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const AddLayerComponent = require('./addlayer');
const MapService = require('../mapservice');

// map vue component
const vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    const {service} = this.$options;
    return {
      target: this.$options.target,
      maps_container: this.$options.maps_container,
      service,
      hidemaps: this.$options.service.state.hidemaps
    }
  },
  components: {
    'addlayer': AddLayerComponent
  },
  computed: {
    mapcontrolsalignement: function() {
      return this.service.state.mapcontrolsalignement;
    }
  },
  mounted: function() {
    const mapService = this.$options.service;
    this.crs = mapService.getCrs();
    this.$nextTick(() => {
      mapService.setMapControlsContainer($('.g3w-map-controls'));
    });
    // listen of after addHideMap
    mapService.onafter('addHideMap', ({layers=[], mainview=false, switchable=false} = {}) => {
      this.$nextTick(() => {
        mapService._addHideMap({layers, mainview, switchable});
      })
    })
  },
  methods: {
    showHideControls: function () {
      const mapControls = this.$options.service.getMapControls();
      mapControls.forEach((control) => {
        if (control.type != "scaleline")
          control.control.showHide();
      })
    }
  }
};
// interanl registration
const InternalComponent = Vue.extend(vueComponentOptions);

Vue.component('g3w-map', vueComponentOptions);

function MapComponent(options = {}) {
  base(this, options);
  this.id = "map-component";
  this.title = "Catalogo dati";
  const target = options.target || "map";
  const maps_container = options.maps_container || "g3w-maps";
  options.target = target;
  options.maps_container = maps_container;
  this.setService(new MapService(options));
  merge(this, options);
  this.internalComponent = new InternalComponent({
    service: this._service,
    target,
    maps_container
  });
}

inherit(MapComponent, Component);

const proto = MapComponent.prototype;

proto.layout = function(width, height) {
  $(`#${this.target}`).height(height);
  $(`#${this.target}`).width(width);
  this._service.layout({width, height});
};

module.exports =  MapComponent;

