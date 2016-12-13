var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');


var InternalComponent = Vue.extend({
  template: require('./printpage.html'),
  data: function() {
    return {
      url: 'http://localhost:3000/ows/15/qdjango/28/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetPrint&TEMPLATE=A4&map0%3ASCALE=5000&ROTATION=0&map0%3AEXTENT=1600835.6712938258%2C4861132.3075508%2C1601786.271293826%2C4862414.7075508&DPI=300&FORMAT=pdf&CRS=EPSG%3A3003&LAYERS=CATASTO%2CCIVICI'
    }
  },
  ready: function() {
    console.log(this.url);
    // Asynchronous download PDF
    PDFJS.getDocument(this.url)
      .then(function(pdf) {
        return pdf.getPage(1);
      })
      .then(function(page) {
        // Set scale (zoom) level
        var scale = 1.5;

        // Get viewport (dimensions)
        var viewport = page.getViewport(scale);

        // Get canvas#the-canvas
        var canvas = document.getElementById('pdf');

        // Fetch canvas' 2d context
        var context = canvas.getContext('2d');

        // Set dimensions to Canvas
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Prepare object needed by render method
        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        // Render PDF page
        page.render(renderContext);
      });
  }
});

var PrintPage = function(options) {
  var options = options || {};
  base(this);
  // istanzio il componente interno
  var internalComponent = new InternalComponent();
  //internalComponent.url = options.url;
  this.setInternalComponent(internalComponent);
};

inherit(PrintPage, Component);


module.exports = PrintPage;


