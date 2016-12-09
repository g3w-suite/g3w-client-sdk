var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var GUI = require('gui/gui');
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');
var PrintService = require('core/print/printservice');
var resToScale = require('core/utils/geo').resToScale;
var scaleToRes = require('core/utils/geo').scaleToRes;
var config = require('./config');
var scale = config.scale;
var dpis= config.dpis;

function PrintComponentService() {
  base(this);
  this._moveMapKeyEvent = null;
  this.state = {};
  this.state.print = ProjectsRegistry.getCurrentProject().state.print;
  this.state.visible = this.state.print.length ? true : false;
  // qui da vedere meglio
  this.state.rotation = 0;
  this.state.bbox = null;
  this.state.center = null;
  this.state.size = null;
  this.state.scala = 5000;
  this.state.scale = scale;
  this.state.dpis = dpis;
  //var mapService = GUI.getComponent('map').getSevice();
  // metodo per il cambio di template
  this.changeTemplate = function(template) {
    //TODO
  };
  // metodo per il cambio di scala
  this.changeScale = function(scale) {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    this.state.scala = scale;
    this._setBBoxPrintArea();
    mapService.setInnerGreyCoverBBox({
      type: 'coordinate',
      bbox: this.state.bbox
    });

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
  this._setBBoxPrintArea = function() {
    var scale = this.state.scala || 1000;
    var resolution = scaleToRes(scale);
    var height = this.state.size[1]/2; // numero di pixel raggio altezza
    var width = this.state.size[0]/2; // numero di pixel raggio larghezza
    x_min = this.state.center[0] - (width*resolution);
    y_min = this.state.center[1] - (height*resolution);
    x_max = this.state.center[0] + (width*resolution);
    y_max = this.state.center[1] + (height*resolution);
    this.state.bbox =  [x_min, y_min, x_max, y_max]
  };

  // metodo per la visualizzazione dell'area grigia o meno
  this.showPrintArea = function(bool) {
    var self = this;
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    this.state.size = map.getSize();
    var zoom = map.getView().getZoom();
    this.state.center = map.getView().getCenter();
    this._setBBoxPrintArea();
    this._moveMapKeyEvent = map.on('moveend', function() {
      self.state.center = this.getView().getCenter();
      self._setBBoxPrintArea();
      mapService.setInnerGreyCoverBBox({
        type: 'coordinate',
        bbox: self.state.bbox
      });
    });
    if (bool) {
      // setto le caratteristiche del bbox interno
      mapService.setInnerGreyCoverBBox({
        type: 'coordinate',
        bbox: self.state.bbox,
        rotation: 0
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