var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var MapService = require('../mapservice');
// componente vue della mappa
var vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    return {
      target: 'map' // specidica l'id
    }
  },
  mounted: function(){
    var self = this;
    var mapService = this.$options.mapService;
    this.$nextTick(function() {
      mapService.setTarget(self.$el.id);
    });
    // questo serve per quando viene cambiato progetto/vista cartografica,
    // in cui viene ricreato il viewer (e quindi la mappa)
    mapService.onafter('setupViewer',function() {
      mapService.setTarget(self.$el.id);
    });
  },
  methods: {
    onAddLayer: function(evt) {
      var mapService = this.$options.mapService;
      var reader = new FileReader();
      var fileObj = {
        name: evt.target.files[0].name,
        visible: true,
        title: evt.target.files[0].name,
        custom: true,
        id: 'customLayer-' +  evt.target.files[0].name,
        visible: true
      };
      reader.onload = function(evt) {
        mapService.addExternalLayer(evt, fileObj);
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
