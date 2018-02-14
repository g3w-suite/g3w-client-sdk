const GUI = require('gui/gui');
const MapService = require('core/mapservice');

const GeocodingListPanelComponent = Vue.extend({
  template: require('./listpanel.html'),
  methods: {
    goto: function(item){
      const x = parseFloat(item.lon);
      const y = parseFloat(item.lat);
      MapService.goToWGS84([x,y]);
      const geojson = item.geojson;
      MapService.highlightGeometry(geojson,4000,true);
      GUI.closeListing();
    }
  }
});

module.exports = GeocodingListPanelComponent;
