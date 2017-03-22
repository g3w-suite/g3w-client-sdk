var inherit = require('core/utils/utils').inherit;
var resolve = require('core/utils/utils').resolve;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');


function PrinterQGISProvider() {
  base(this);
  this._getPrintUrl = function(options) {
    var options = options || {};
    var project =  ProjectsRegistry.getCurrentProject();
    var templateMap = options.map || 'map0';
    var url = project.getWmsUrl();
    // devo fare il reverse perchè l'odine conta sulla visualizzazione del print
    var layers = _.reverse(project.getLayers({
      ACTIVE: true,
      VISIBLE: true
      //SELECTEDORALL: true
    }));
    layers = _.map(layers,function(layer){
      return layer.getQueryLayerName()
    });
    var params = {
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetPrint',
      TEMPLATE: options.template,
      DPI: options.dpi,
      FORMAT: 'pdf',
      CRS:'EPSG:'+project.state.crs,
      LAYERS: layers.join()
    };
    // AL comento commento
    params[templateMap+':SCALE'] = options.scale;
    params[templateMap+':EXTENT'] = options.extent;
    params[templateMap+':ROTATION'] = options.rotation;
    url = url + '?' + $.param(params);
    return resolve(url);
  };

  this.print = function(options) {
    /* options è un oggetto che contiene:
     type: tipo di printer server
     url: url a cui effettuare la richiesta
     params : oggetto contenete i parametri necessari alla creazione della richiesta
     come ad esempio filter etc ..
     */
    var options = options || {};
    var url = this._getPrintUrl(options);
    return url;
    //return $.get(url_params.url, url_params.params)

  };
}

inherit(PrinterQGISProvider, G3WObject);

module.exports = new PrinterQGISProvider;


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