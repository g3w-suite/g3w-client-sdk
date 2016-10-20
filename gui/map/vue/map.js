var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var t = require('core/i18n/i18n.service').t;
var resolve = require('core/utils/utils').resolve;
var GUI = require('gui/gui');   
var Component = require('gui/vue/component');
var RouterService = require('core/router');
var ol3helpers = require('g3w-ol3/src/g3w.ol3').helpers;
var MapsRegistry = require('core/map/mapsregistry');
var MapService = require('../mapservice');
// componente vue della mappa
var vueComponentOptions = {
  template: require('./map.html'),
  data: function() {
    return {
      target: 'map' // specidica l'id
    }
  },
  ready: function(){
    var self = this;
    var mapService = this.$options.mapService;
    mapService.setTarget(this.$el.id);
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
  this._service = new MapService(options);
  merge(this, options);
  this.internalComponent = new InternalComponent({
    mapService: this._service // definisco il mapservice
  });
  this.internalComponent.target = this.target;
}

inherit(MapComponent, Component);

var proto = MapComponent.prototype;
// funzione che ne definisce il layout
proto.layout = function(width, height) {
  // im particolare larghezza e altezza
  $('#'+this.target).height(height);
  $('#'+this.target).width(width);
  this._service.layout(width,height);
};

module.exports =  MapComponent;
