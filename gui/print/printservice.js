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
  this._page = null;
  this._mapService = null;
  this._map = null;
  this._project = ProjectsRegistry.getCurrentProject();
  this.state.print = ProjectsRegistry.getCurrentProject().state.print;
  this.state.visible = this.state.print.length ? true : false;
  this.state.isShow = false;
  this.state.loading = false;
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
    this.state.map = this.state.print[0].maps[0].name;
    this.state.width = this.state.print[0].maps[0].w;
    this.state.height = this.state.print[0].maps[0].h;
  }
  //var mapService = GUI.getComponent('map').getSevice();
  // metodo per il cambio di template
  this.changeTemplate = function() {
    var self = this;
    var template = this.state.template;
    _.forEach(this.state.print, function(print) {
      if (print.name == template) {
        self.state.width = print.maps[0].w;
        self.state.height = print.maps[0].h;
        self.state.map = print.maps[0].name;
      }
    });
    this._setBBoxPrintArea();
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner
    });
    this._changePrintOutput();
  };

  // metodo per il cambio di scala
  this.changeScale = function() {
    this._setBBoxPrintArea();
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner
    });
    this._changePrintOutput();
  };

  // metodo per il cambio di rotazione
  this.changeRotation = function() {
    this._mapService.setInnerGreyCoverBBox({
      rotation: this.state.rotation
    });
    this._changePrintOutput();
  };

  // funzione che restituisce le options del print
  this._getOptionsPrint = function() {
    var options = {
      scale: this.state.scala,
      extent: this.state.inner.join(),
      rotation: this.state.rotation,
      dpi: this.state.dpi,
      template: this.state.template,
      map: this.state.map,
      width: this.state.width,
      height: this.state.height
    };
    return options;
  };

  // funzione print
  this.print = function() {
    var self = this;
    this._changePrintArea();
    var options = this._getOptionsPrint();
    PrintService.print(options)
    .then(function(url) {
      // chiamo il metodo pushContent
      self._page = new PrintPage({
        url: url,
        service: self
      });
      GUI.setContent({
        content: self._page,
        title: 'Stampa'
      });
      if (!self.state.isShow) {
        self.state.isShow = true;
        self.emit('showpdf', true);
      }
    })
  };


  // funzione che setta il BBOX della printArea
  this._setBBoxPrintArea = function() {
    var scale = this.state.scala || 1000;
    var resolution = scaleToRes(scale);
    // rapporto tra largheza e altezza della mappa nel template
    var rapportoMappaTemplate = this.state.width/this.state.height;
    // rapporto larghezza e altezza della mappa nel client (viewport)
    var rapportoMappaClient = this.state.size[0]/this.state.size[1];
    var width, height;
    if (rapportoMappaClient > 1) {
      height = this.state.size[1] / 2; // numero di pixel raggio larghezza
      width = height * rapportoMappaTemplate ; // numero di pixel raggio altezza
    } else {
      width = this.state.size[0] / 2; // numero di pixel raggio larghezza
      height = width / rapportoMappaTemplate; // numero di pixel raggio altezza
    }
    x_min = this.state.center[0] - (width*resolution);
    y_min = this.state.center[1] - (height*resolution);
    x_max = this.state.center[0] + (width*resolution);
    y_max = this.state.center[1] + (height*resolution);
    this.state.inner =  [x_min, y_min, x_max, y_max];
  };

  // funzione che ricalcola il centro e il size della mappa
  this._changePrintArea = function() {
    this.state.center = this._map.getView().getCenter();
    this.state.size = this._map.getSize();
    this._setBBoxPrintArea();
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner
    });
    this._changePrintOutput();
    // vado a risettare il centro della mappa in posizione originale
    this._map.getView().setCenter(this.state.center);
  };

  // metodo chiusura print panel
  this._clearPrintService = function(bool) {
    var bool = _.isBoolean(bool) ? bool : true;
    this._map.unByKey(this._moveMapKeyEvent);
    this._moveMapKeyEvent = null;
    this.state.isShow = bool;
    this.emit('showpdf', bool);
    this._changePrintArea();
  };

  // funzione che fa il change dell'ouput
  this._changePrintOutput = function() {
    var self = this;
    if (this.state.isShow) {
      var options = this._getOptionsPrint();
      PrintService.print(options)
        .then(function (url) {
          if (self._page) {
            self._page.internalComponent.url = url;
          }
        })
    }
  };

  //funzione che setta l'area iniziale
  this.setInitialPrintArea = function() {
    var self = this;
    this.state.center = this._map.getView().getCenter();
    this.state.size = this._map.getSize();
    this._setBBoxPrintArea();
    this._moveMapKeyEvent = this._map.on('moveend', function() {
      self.state.center = this.getView().getCenter();
      self._setBBoxPrintArea();
      self._mapService.setInnerGreyCoverBBox({
        inner: self.state.inner
      });
      self._changePrintOutput();
    });
    // setto le caratteristiche del bbox interno
    this._mapService.setInnerGreyCoverBBox({
      inner: self.state.inner,
      rotation: 0
    });
    this._mapService.startDrawGreyCover();
    if (this.state.isShow) {
      this._changePrintOutput();
    }
  };

  // metodo per la visualizzazione dell'area grigia o meno
  this.showPrintArea = function(bool) {
    this._mapService = GUI.getComponent('map').getService();
    this._map = this._mapService.viewer.map;
    if (bool) {
      this.setInitialPrintArea();
    } else {
      this._mapService.stopDrawGreyCover();
      this._clearPrintService();
    }
  };

  // metodo richiamato dal template sidebar
  this.showContex = function(bool) {
    this.showPrintArea(bool);
  }
}

inherit(PrintComponentService, G3WObject);

module.exports = PrintComponentService;