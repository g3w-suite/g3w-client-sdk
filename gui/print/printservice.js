var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var GUI = require('gui/gui');
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');
var PrintService = require('core/print/printservice');
var resToScale = require('core/utils/geo').resToScale;
var scaleToRes = require('core/utils/geo').scaleToRes;
var printConfig = require('./printconfig');
var PrintPage = require('./vue/printpage');
var scale = printConfig.scale;
var dpis = printConfig.dpis;

function PrintComponentService() {
  base(this);
  this._moveMapKeyEvent = null;
  this.state = {};
  this._project = ProjectsRegistry.getCurrentProject();
  this.state.print = ProjectsRegistry.getCurrentProject().state.print;
  this.state.visible = this.state.print.length ? true : false;
  if (this.state.visible) {
    // Imposto le configurazioni inziali da rivedere
    this.state.template = this.state.print[0].name;
    this.state.rotation = 0;
    this.state.inner = null;
    this.state.center = null;
    this.state.size = null;
    this.state.scala = 5000;
    this.state.scale = scale;
    this.state.dpi = dpis[0];
    this.state.dpis = dpis;
  }
  //var mapService = GUI.getComponent('map').getSevice();
  // metodo per il cambio di template
  this.changeTemplate = function(template) {
    //TODO
  };
  // metodo per il cambio di scala
  this.changeScale = function() {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    this._setBBoxPrintArea();
    mapService.setInnerGreyCoverBBox({
      inner: this.state.inner
    });

  };
  // metodo per il cambio di rotazione
  this.changeRotation = function() {
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    mapService.setInnerGreyCoverBBox({
      rotation: this.state.rotation
    });
  };

  // lancia il print
  this.print = function() {
    var options = {
      scale: this.state.scala,
      extent: this.state.inner.join(),
      rotation: this.state.rotation,
      dpi: this.state.dpi,
      template: this.state.template

    };
    PrintService.print(options)
    .then(function() {
      // chaimao il metodo pushContent
      console.log(PrintPage);
      var page = new PrintPage();
      console.log(page);
      GUI.pushContent({
        content: new PrintPage,
        backonclose: true
      });
    })
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
    this.state.inner =  [x_min, y_min, x_max, y_max]
  };

  // metodo per la visualizzazione dell'area grigia o meno
  this.showPrintArea = function(bool) {
    var self = this;
    var mapService = GUI.getComponent('map').getService();
    var map = mapService.viewer.map;
    this.state.size = map.getSize();
    this.state.center = map.getView().getCenter();
    this._setBBoxPrintArea();
    this._moveMapKeyEvent = map.on('moveend', function() {
      self.state.center = this.getView().getCenter();
      self._setBBoxPrintArea();
      mapService.setInnerGreyCoverBBox({
        inner: self.state.inner
      });
    });
    if (bool) {
      // setto le caratteristiche del bbox interno
      mapService.setInnerGreyCoverBBox({
        inner: self.state.inner,
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