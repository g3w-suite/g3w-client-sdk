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
  // recupero il project
  this._project = ProjectsRegistry.getCurrentProject();
  // inizializzo lo state
  this.state = {};
  // prendo le informazioni del print
  this.state.print = this._project.state.print;
  // setto lo state visible
  this.state.visible = this.state.print.length ? true : false;
  this.state.isShow = false;
  this.state.loading = false;
  this.state.url = null;
  if (this.state.visible) {
    // Imposto le configurazioni inziali da rivedere
    this.state.template = this.state.print[0].name;
    this.state.rotation = 0;
    this.state.inner = null;
    this.state.center = null;
    this.state.size = null;
    this.state.scale = scale;
    this.state.scala = null;
    this.state.dpis = dpis;
    this.state.dpi = dpis[0];
    this.state.map = this.state.print[0].maps[0].name;
    this.state.width = this.state.print[0].maps[0].w;
    this.state.height = this.state.print[0].maps[0].h;
  }
  this._moveMapKeyEvent = null;
  this._loadPdfKey = null;
  // istanzio il componete page per la visualizzazione del pdf
  this._page = null;
  this._mapService = null;
  this._map = null;
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
    this._page = new PrintPage({
      service: this
    });
    var options = this._getOptionsPrint();
    PrintService.print(options)
    .then(function(url) {
      self.state.url = url;
      GUI.setContent({
        content: self._page,
        title: 'Stampa'
      });
      if (!self.state.isShow) {
        self.state.isShow = true;
        // emetto l'evento showpdf per disabilitare il bottone
        //crea pdf
        self.emit('showpdf', true);
      }
    })
  };


  // funzione che setta il BBOX della printArea
  this._setBBoxPrintArea = function() {
    var scale = this.state.scala;
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
  this._clearPrintService = function() {
    // rimovo l'evento movend della mappa
    this._map.unByKey(this._moveMapKeyEvent);
    this._moveMapKeyEvent = null;
    this._changePrintArea();
  };

  // funzione che fa il change dell'ouput
  this._changePrintOutput = function() {
    var self = this;
    if (this.state.isShow) {
      this.state.loading = true;
      var options = this._getOptionsPrint();
      PrintService.print(options)
        .then(function (url) {
          if (self.state.url == url) {
            self.state.loading = false;
          }
          self.state.url = url;
        })
    }
  };

  this._getInitialScaleFromProject = function() {
    var self = this;
    var resolution = this._map.getView().getResolution();
    var initialScala = resToScale(resolution);
    _.forEach(printConfig.scale, function(scala, index) {
      if (initialScala < scala.value) {
        // da rivedere tutto il vue select
        // al momento fatto con jquery
        self.state.scala = printConfig.scale[index-1].value;
        // da rivedere
        $('#scala').val(printConfig.scale[index-1].value);
        return false
      }
    });
  };

  //funzione che setta l'area iniziale
  this.setInitialPrintArea = function() {
    var self = this;
    this.state.center = this._map.getView().getCenter();
    this.state.size = this._map.getSize();
    this._getInitialScaleFromProject();
    this._setBBoxPrintArea();
    this._moveMapKeyEvent = this._map.on('moveend', function() {
      self.state.center = this.getView().getCenter();
      if (!self.state.isShow) {
        self.state.size = this.getSize();
      }
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
  // funzione che abilitita e disabilita il bottone crea pdf
  this._enableDisablePrintButton = function(bool) {
    this.state.isShow = bool;
    this.emit('showpdf', bool);
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