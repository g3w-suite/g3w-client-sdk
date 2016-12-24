var ResetControl = require('g3w-ol3/src/controls/resetcontrol');
var QueryControl = require('g3w-ol3/src/controls/querycontrol');
var ZoomBoxControl = require('g3w-ol3/src/controls/zoomboxcontrol');
var QueryBBoxControl = require('g3w-ol3/src/controls/querybboxcontrol');
var QueryByPolygonControl = require('g3w-ol3/src/controls/querybypolygoncontrol');
var Control = require('g3w-ol3/src/controls/control');

var OLControl = require('g3w-ol3/src/controls/olcontrol');

var ControlsFactory = {
  create: function(options) {
    var control;
    var ControlClass = ControlsFactory.CONTROLS[options.type];
    var layers = options.layers; // optione che mi server per far visualizzare o meno il controllo
    if(ControlClass) {
      control = new ControlClass(options);
    }
    // nel caso siano stati specificati i layers del progetto su cui interrogare
    if (layers && control instanceof Control) {
      // ricavo le geometry su cui deve essere fatto i layer
      var controlGeometryTypes = control.getGeometryTypes();
      // imposto il valore iniziale di visible se è un array vuoto vuol dire che non ho specificato nessuna
      // geometria rilevante e quindi deve essere visible
      var visible = (controlGeometryTypes.length) ? false : true;
      _.forEach(layers, function (layer) {
        if (controlGeometryTypes.indexOf(layer.getGeometryType()) > -1) {
          visible = true;
          return false;
        }
      });
      if (visible) {
        return control;
      } else {
        return null;
      }
    } else {
      return control;
    }
  }
};

ControlsFactory.CONTROLS = {
  'reset': ResetControl,
  'zoombox': ZoomBoxControl,
  'zoomtoextent': OLControl,
  'query': QueryControl,
  'querybbox': QueryBBoxControl,
  'querybypolygon': QueryByPolygonControl,
  'zoom': OLControl,
  'scaleline': OLControl,
  'overview': OLControl
};

module.exports = ControlsFactory;
