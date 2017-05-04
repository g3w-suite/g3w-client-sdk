var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var MapService = require('../mapservice');
//componente vue.color
var ChromeComponent = VueColor.Chrome;
var AddLayerComponent = {
  template: require('./addlayer.html'),
  props: ['service'],
  data: function() {
    return {
      layer: {
        name: null,
        type: null,
        crs: null,
        color: {
          hex: '#2C318F',
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
  mounted: function(){
    this.layer.crs = this.service.getCrs();
    this.$nextTick(function() {
      //vado a rimuovere elementi che non mi servono
      $('.vue-color__chrome__toggle-btn').remove();
      $('.vue-color__editable-input__label').remove();
      $('.vue-color__chrome__active-color').css('margin-top', 0);
      $('.vue-color__chrome__saturation-wrap').css('padding-bottom','100px');
      $('.vue-color__chrome').css({
        'box-shadow': '0 0 0 0',
        'border': '1px solid #97A1A8'
      });
    });
    this.service.on('addexternallayer', function() {
      $('#modal-addlayer').modal('show');
    });
  },
  methods: {
    onChangeColor: function(val) {
      this.layer.color = val;
    },
    onAddLayer: function(evt) {
      var self = this;
      var reader = new FileReader();
      var name = evt.target.files[0].name;
      this.layer.name = name;
      this.layer.title = name;
      this.layer.id = name;
      var type = evt.target.files[0].name.split('.');
      this.layer.type = type[type.length-1].toLowerCase();
      if (this.layer.type == 'zip') {
        self.layer.data = evt.target.files[0];
        $('input:file').val(null);
      } else {
        reader.onload = function(evt) {
          self.layer.data = evt.target.result;
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
        var layer = _.cloneDeep(this.layer);
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
        hex: '#2C318F',
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

// componente vue della mappa
var vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    return {
      target: 'map', // specidica l'id
      service: this.$options.mapService
    }
  },
  components: {
    'addlayer': AddLayerComponent
  },
  mounted: function() {
    var self = this;
    var mapService = this.$options.mapService;
    this.crs = mapService.getCrs();
    this.$nextTick(function() {
      mapService.setTarget(self.$el.id);
    });
    // questo serve per quando viene cambiato progetto/vista cartografica,
    // in cui viene ricreato il viewer (e quindi la mappa)
    mapService.onafter('setupViewer',function() {
      mapService.setTarget(self.$el.id);
    });
  }
};
// registro internamente
var InternalComponent = Vue.extend(vueComponentOptions);
// viene definito il componte map
Vue.component('g3w-map', vueComponentOptions);
//componente mappa
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

var proto = MapComponent.prototype;
// funzione che ne definisce il layout della mappa
// ed è chamata dall viewport per risettare le size delle due view
proto.layout = function(width, height) {
  // setto alterzza e larghezza nuove
  $('#'+this.target).height(height);
  $('#'+this.target).width(width);
  this._service.layout(width,height);
};

module.exports =  MapComponent;

