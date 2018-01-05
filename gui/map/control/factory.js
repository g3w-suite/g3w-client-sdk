const ResetControl = require('g3w-ol3/src/controls/resetcontrol');
const QueryControl = require('g3w-ol3/src/controls/querycontrol');
const ZoomBoxControl = require('g3w-ol3/src/controls/zoomboxcontrol');
const QueryBBoxControl = require('g3w-ol3/src/controls/querybboxcontrol');
const QueryByPolygonControl = require('g3w-ol3/src/controls/querybypolygoncontrol');
const GeolocationControl = require('g3w-ol3/src/controls/geolocationcontrol');
const StreetViewControl = require('g3w-ol3/src/controls/streetviewcontrol');
const AddLayersControl = require('g3w-ol3/src/controls/addlayers');
const LengthControl = require('g3w-ol3/src/controls/lengthcontrol');
const AreaControl = require('g3w-ol3/src/controls/areacontrol');
const Control = require('g3w-ol3/src/controls/control');
const OLControl = require('g3w-ol3/src/controls/olcontrol');
const NominatimControl = require('g3w-ol3/src/controls/nominatimcontrol');

const ControlsFactory = {
  create: function(options) {
    let control;
    const ControlClass = ControlsFactory.CONTROLS[options.type];
    const layers = options.layers; // opzione che mi server per far visualizzare o meno il controllo
    if (ControlClass) {
      // istanzio il controllo
      control = new ControlClass(options);
    }
    // nel caso siano stati specificati i layers del progetto su cui interrogare
    if (layers && control instanceof Control) {
      // nel caso l'array dei layer è vuoto non visualizzo il controllo
      if (!layers.length) {
        return null
      }
      const controlGeometryTypes = control.getGeometryTypes();
      // imposto il valore iniziale di visible se è un array vuoto vuol dire che non ho specificato nessuna
      // geometria rilevante e quindi deve essere visible
      let visible = (controlGeometryTypes.length) ? false : true;
      _.forEach(layers, (layer) => {
        if (controlGeometryTypes.indexOf(layer.getGeometryType()) > -1) {
          visible = true;
          return false;
        }
      });
      // se visibile allora restituisco il controllo altrimenti null
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
  'geolocation': GeolocationControl,
  'streetview': StreetViewControl,
  'zoom': OLControl,
  'scaleline': OLControl,
  'overview': OLControl,
  'nominatim': NominatimControl,
  'addlayers': AddLayersControl,
  'length': LengthControl,
  'area': AreaControl
};

module.exports = ControlsFactory;
