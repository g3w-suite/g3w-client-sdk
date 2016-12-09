var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var GUI = require('gui/gui');
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');
var PrintService = require('core/print/printservice');

var BBOXHARDCODED = [1600982.263324788, 4861416.702669956, 1601660.8876835187, 4862126.173590447];

function PrintComponentService() {
  base(this);
  this._moveMapKeyEvent = null;
  this.state = ProjectsRegistry.getCurrentProject().state.print;
  //var mapService = GUI.getComponent('map').getSevice();
  // metodo per il cambio di template
  this.changeTemplate = function(template) {
    //TODO
  };
  // metodo per il cambio di scala
  this.changeScale = function(scale) {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    mapService.setInnerGreyCoverScale(scale);
  };
  // metodo per il cambio di rotazione
  this.changeRotation = function(rotation) {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    mapService.setInnerGreyCoverBBox({
      rotation: rotation
    });
  };

  // lancia il print
  this.print = function() {
    //PrintService.print();
    alert('Stampo');
  };

  // metodo per la visualizzazione dell'area grigia o meno
  this.showPrintArea = function(bool) {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    this._moveMapKeyEvent = map.on('moveend', function() {
      mapService.setInnerGreyCoverBBox({
        type: 'coordinate',
        bbox: BBOXHARDCODED
      });
    });
    if (bool) {
      // setto le caratteristiche del bbox interno
      mapService.setInnerGreyCoverBBox({
        type: 'coordinate',
        bbox: BBOXHARDCODED,
        rotation: 0,
        scale:1
      });
      mapService.startDrawGreyCover();
    } else {
      mapService.stopDrawGreyCover();
      map.unByKey(this._moveMapKeyEvent);
      this._moveMapKeyEvent = null;
    }
  };

  // metodo richiamato dal template sidebar
  this.showContex = function(bool) {
    this.showPrintArea(bool);
  }
  
}

inherit(PrintComponentService, G3WObject);

module.exports = PrintComponentService;