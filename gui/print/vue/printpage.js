var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');


var InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      url: this.$options.url//'http://localhost:3000/ows/15/qdjango/28/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPrint&TEMPLATE=A4&map0%3ASCALE=5000&ROTATION=0&map0%3AEXTENT=1600835.6712938258%2C4861132.3075508%2C1601786.271293826%2C4862414.7075508&DPI=300&FORMAT=pdf&CRS=EPSG%3A3003&LAYERS=CATASTO%2CCIVICI'
    }
  },
  ready: function() {
    console.log('pronto')
  }
});

var PrintPage = function(options) {

  var options = options || {};
  var url = options.url;
  base(this);
  // istanzio il componente interno
  var internalComponent = new InternalComponent({
    url: url
  });
  //internalComponent.url = options.url;
  this.setInternalComponent(internalComponent);
};

inherit(PrintPage, Component);


module.exports = PrintPage;


