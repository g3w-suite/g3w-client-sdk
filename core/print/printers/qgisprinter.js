var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

function QGISPrinter() {
  base(this);
  this.print = function(options) {
    var options = options || {};
    var url = options.url;
    var params = options.params;
  };

  this.createParamsUrl = function(params) {
    var urlParams = {
      EXTENT: params.extent,
      ROTATION: params.rotation,
      SCALE: params.scale,
      LAYERS: params.layers,
      STYLES: params.styles || '',
      GRID_INTERVAL_X: params.gridx || null,
      GRID_INTERVAL_Y: params.gridy || null
    };
    return urlParams
  };

  this.print = function(options) {
    /* options è un oggetto che contiene:
     type: tipo di printer server
     url: url a cui effettuare la richiesta
     params : oggetto contenete i parametri necessari alla creazione della richiesta
     come ad esempio filter etc ..
     */
    if (!type) {var type = 'QGIS'}

    printer.print(url, params)
      .then(function(){
        console.log('richiesta completatata')
      })
  };
}

inherit(QGISPrinter, G3WObject);

module.exports = QGISPrinter;


/*
 http://localhost/fcgi-bin/qgis_mapserver/qgis_mapserv.fcgi?MAP=/home/marco/geodaten/projekte/composertest.qgs&SERVICE=WMS&VERSION=1.3.0
 &REQUEST=GetPrint&TEMPLATE=Composer 1&
 map0:extent=693457.466131,227122.338236,700476.845177,230609.807051&
 BBOX=693457.466131,227122.338236,700476.845177,230609.807051&
 CRS=EPSG:21781&WIDTH=1467&HEIGHT=729&LAYERS=layer0,layer1&
 STYLES=,&FORMAT=pdf&DPI=300&TRANSPARENT=true

 In detail, the following parameters can be used to set properties for composer maps:

 <mapname>:EXTENT=<xmin,ymin,xmax, ymax> //mandatory
 <mapname>:ROTATION=<double> //optional, defaults to 0
 <mapname>:SCALE=<double> //optional. Forces scale denominator as server and client may have different scale calculations
 <mapname>:LAYERS=<comma separated list with layer names> //optional. Defaults to all layer in the WMS request
 <mapname>:STYLES=<comma separated list with style names> //optional
 <mapname>:GRID_INTERVAL_X=<double> //set the grid interval in x-direction for composer grids
 <mapname>:GRID_INTERVAL_Y=<double> //set the grid interval in x-direction for composer grids
 */