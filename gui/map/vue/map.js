const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const MapService = require('../mapservice');
//Vue color componet
const ChromeComponent = VueColor.Chrome;
ChromeComponent.mounted =  function() {
  this.$nextTick(function() {
    // remove all the tihing that aren't useful
    $('.vue-color__chrome__toggle-btn').remove();
    $('.vue-color__editable-input__label').remove();
    $('.vue-color__chrome__saturation-wrap').css('padding-bottom','100px');
    $('.vue-color__chrome').css({
      'box-shadow': '0 0 0 0',
      'border': '1px solid #97A1A8'
    });
  });
};

const AddLayerComponent = {
  template: require('./addlayer.html'),
  props: ['service'],
  data: function() {
    return {
      layer: {
        name: null,
        type: null,
        crs: null,
        color: {
          hex: '#194d33',
          rgba: {
            r: 25,
            g: 77,
            b: 51,
            a: 1
          },
          a: 1
        },
        data: null,
        visible: true,
        title: null,
        id: null,
        external: true
      }
    }
  },
  components: {
    'chrome-picker': ChromeComponent
  },
  mounted: function() {
    this.layer.crs = this.service.getCrs();
    this.service.on('addexternallayer', function() {
      $('#modal-addlayer').modal('show');
    });
  },
  methods: {
    onChangeColor: function(val) {
      this.layer.color = val;
    },
    onAddLayer: function(evt) {
      const reader = new FileReader();
      const name = evt.target.files[0].name;
      this.layer.name = name;
      this.layer.title = name;
      this.layer.id = name;
      const type = evt.target.files[0].name.split('.');
      this.layer.type = type[type.length-1].toLowerCase();
      if (this.layer.type == 'zip') {
        this.layer.data = evt.target.files[0];
        $('input:file').val(null);
      } else {
        reader.onload = (evt) => {
          this.layer.data = evt.target.result;
          // vado a rimuovere il valore del layer ultimo aggiunto per
          // fare in mdo che l'evento change possa scattare
          $('input:file').val(null);
        };
        reader.readAsText(evt.target.files[0]);
      }
    },
    addLayer: function() {
      if (this.layer.name) {
        //devo fare il cloen al fine di evitare che quando
        // riapro la modale ci si sempre il
        const layer = _.cloneDeep(this.layer);
        this.service.addExternalLayer(layer);
        $('#modal-addlayer').modal('hide');
        this.clearLayer();
      }
    },
    clearLayer: function() {
      this.layer.name = null;
      this.layer.title = null;
      this.layer.id = null;
      this.layer.type = null;
      this.layer.crs = this.service.getCrs();
      this.layer.color = {
        hex: '#194d33',
          rgba: {
          r: 25,
            g: 77,
            b: 51,
            a: 1
        },
        a: 1
      };
      this.layer.data = null;
    }
  }
};

// map vue component
const vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    return {
      target: 'map', // specidica l'ide
      service: this.$options.mapService
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
    const mapService = this.$options.mapService;
    this.crs = mapService.getCrs();
    this.$nextTick(() => {
      mapService.setTarget(this.$el.id);
    });
    // it useful when a map is changed by chage map button
    mapService.onafter('setupViewer',() => {
      mapService.setTarget(this.$el.id);
    });
  },
  methods: {
    showHideControls: function () {
      const mapControls = this.$options.mapService.getMapControls();
      mapControls.forEach((control) => {
        if (control.type != "scaleline")
          control.control.showHide();
      })
    },
    isMobile: function() {
      return isMobile.any;
    }
  }
};
// interanl registration
const InternalComponent = Vue.extend(vueComponentOptions);

Vue.component('g3w-map', vueComponentOptions);

function MapComponent(options) {
  base(this, options);
  this.id = "map-component";
  this.title = "Catalogo dati";
  this.target = options.target || 'map';
  this.setService(new MapService(options));
  merge(this, options);
  this.internalComponent = new InternalComponent({
    mapService: this._service // definisco il mapservice
  });
  this.internalComponent.target = this.target;
}

inherit(MapComponent, Component);

const proto = MapComponent.prototype;

proto.layout = function(width, height) {
  $('#'+this.target).height(height);
  $('#'+this.target).width(width);
  this._service.layout({width, height});
};

module.exports =  MapComponent;

