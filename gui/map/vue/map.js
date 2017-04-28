var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var MapService = require('../mapservice');
// componente vue della mappa
var ChromeComponent = VueColor.Chrome;
var defaultProps = {
  hex: '#194d33'
};

var vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    return {
      target: 'map', // specidica l'id
      crs: '4326',
      colors: defaultProps
    }
  },
  components: {
    'chrome-picker': ChromeComponent
  },
  mounted: function(){
    var self = this;
    var mapService = this.$options.mapService;
    this.crs = mapService.getCrs();
    this.$nextTick(function() {
      mapService.setTarget(self.$el.id);
      $('.vue-color__chrome__alpha-wrap').remove();
      $('.vue-color__chrome__toggle-btn').remove();
      $('.vue-color__chrome__active-color').css('margin-top', 0);
      $('.vue-color__chrome__saturation-wrap').css('padding-bottom','100px');
    });
    // questo serve per quando viene cambiato progetto/vista cartografica,
    // in cui viene ricreato il viewer (e quindi la mappa)
    mapService.onafter('setupViewer',function() {
      mapService.setTarget(self.$el.id);
    });
  },
  methods: {
    onChangeColor: function(val) {
      this.colors = val;
    },
    onAddLayer: function(evt) {
      var mapService = this.$options.mapService;
      var reader = new FileReader();
      var fileObj = {
        name: evt.target.files[0].name,
        visible: true,
        title: evt.target.files[0].name,
        custom: true,
        id: evt.target.files[0].name,
        visible: true
      };
      var crs = this.crs;
      var color = this.colors.hex;
      var type = evt.target.files[0].name.split('.');
      type = type[type.length-1].toLowerCase();
      reader.onload = function(evt) {
        mapService.addExternalLayer(evt, fileObj, crs, color, type);
        $('#modal-addlayer').modal('hide');
        // vado a rimuovere il valore del layer ultimo aggiunto per
        // fare in mdo che l'evento change possa scattare
        $('input:file').val(null);
      };
      reader.readAsText(evt.target.files[0]);
    }
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
