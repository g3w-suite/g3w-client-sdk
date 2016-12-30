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
  this._initialized = false;
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
  // istanzio il componete page per la visualizzazione del pdf
  this._page = null;
  this._mapService = null;
  this._map = null;
  this._changeScaleFromSelect = false;
  //var mapService = GUI.getComponent('map').getSevice();
  // metodo per il cambio di template
  this.changeTemplate = function() {
    var self = this;
    var template = this.state.template;
    _.forEach(this.state.print, function(print) {
      if (print.name == template) {
        // al momento hardcoded mpa0
        self.state.width = print.maps[0].w;
        self.state.height = print.maps[0].h;
        self.state.map = print.maps[0].name;
      }
    });
    this._setBBoxPrintArea();
    this._changePrintOutput();
  };

  // metodo per il cambio di scala
  this.changeScale = function() {
    var self = this;
    var resolution;
    this._changeScaleFromSelect = true;
    var found = false;
    _.forEach(this.state.scale, function(scala) {
      if (scala.value > self.state.scala)   {
        resolution = scaleToRes((scala.value + 1*self.state.scala)/2);
        found = true;
        return false
      }
    });
    if (!found) {
      resolution = scaleToRes(this.state.scala);
    }
    this._map.getView().setResolution(resolution);
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
        self.state.size = self._map.getSize()
      }
    })
  };


  // funzione che setta il BBOX della printArea
  this._setBBoxPrintArea = function() {
    var resolution = scaleToRes(this.state.scala);
    // rapporto tra largheza e altezza della mappa nel template
    var rapportoMappaTemplate = this.state.width/this.state.height;
    // rapporto larghezza e altezza della mappa nel client (viewport)
    var rapportoMappaClient = this.state.size[0]/this.state.size[1];
    var width, height;
    if (rapportoMappaClient > 1) {
      if (rapportoMappaTemplate > 1) {
        width = this.state.size[0] / 2; // numero di pixel raggio larghezza
        height = width / rapportoMappaTemplate; // numero di pixel raggio altezza
      } else {
        height = this.state.size[1] / 2; // numero di pixel raggio larghezza
        width = height * rapportoMappaTemplate ; // numero di pixel raggio altezza
      }
    } else {
      if (rapportoMappaTemplate > 1) {
        width = this.state.size[0] / 2; // numero di pixel raggio larghezza
        height = width / rapportoMappaTemplate; // numero di pixel raggio altezza
      } else {
        height = this.state.size[1] / 2; // numero di pixel raggio larghezza
        width = height * rapportoMappaTemplate ; // numero di pixel raggio altezza
      }
    }
    x_min = this.state.center[0] - (width*resolution);
    y_min = this.state.center[1] - (height*resolution);
    x_max = this.state.center[0] + (width*resolution);
    y_max = this.state.center[1] + (height*resolution);

    this.state.inner =  [x_min, y_min, x_max, y_max];
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner,
      rotation: this.state.rotation
    });
  };

  // funzione che ricalcola il centro e il size della mappa
  this._changePrintArea = function() {
    this.state.center = this._map.getView().getCenter();
    this.state.size = this._map.getSize();
    this._setBBoxPrintArea();
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
    // verifico se l'otuput pdf è visibile
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

  // funzione che setta la massima e iniziale scala del progetto
  this._getInitialScala = function() {
    var self = this;
    // prendo la risoluzione della mappa
    var resolution = this._map.getView().getResolution();
    // ci calcolo la scala associata
    var initialScala = resToScale(resolution);
    var indexMaxScale = 0;
    _.forEach(this.state.scale, function(scala, index) {
      if (initialScala < scala.value) {
        self.state.scala = self.state.scale[index-1].value;
        $('#scala').val(self.state.scala);
        indexMaxScale = index;
        return false
      }
    });
    if (! this._initialized) {
      // vado a limitare le scale
      this.state.scale.splice(indexMaxScale);
      this._initialized = true;
    }
  };

  //setta la sacala
  this._setScalaFromScales = function(currentscale) {
    var self = this;
    var found = false;
    _.forEach(this.state.scale, function(scala, index) {
      if (currentscale < scala.value) {
        if (index == 0) {
          self.state.scala = self.state.scale[index].value;
          $('#scala').val(self.state.scala);
        } else {
          self.state.scala = self.state.scale[index - 1].value;
          $('#scala').val(self.state.scala);
        }
        found = true;
        return false
      }
    });
    if (!found) {
      this.state.scala = this.state.scale[this.state.scale.length-1].value;
      $('#scala').val(this.state.scala);
    }
  };

  this._setMoveendMapEvent = function() {
    var resolution;
    var self = this;
    this._moveMapKeyEvent = this._map.on('moveend', function() {
      self.state.size = this.getSize();
      self.state.center = this.getView().getCenter();
      if (!self._changeScaleFromSelect) {
        resolution = this.getView().getResolution();
        self._setScalaFromScales(resToScale(resolution));
      }
      self._setBBoxPrintArea();
      self._changePrintOutput();
      self._changeScaleFromSelect = false;
    });
  };

  //funzione che setta l'area iniziale
  this._setPrintArea = function() {
    this.state.center = this._map.getView().getCenter();
    this.state.size = this._map.getSize();
    this._setBBoxPrintArea();
    this._mapService.startDrawGreyCover();
    this._changePrintOutput();
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
      // registo il moveend map event
      this._setMoveendMapEvent();
      // setto la scala iniziale derivato dalle proprietà della mappa
      // e limito la selezione delle scale
      this._getInitialScala();
      // setto la area di print
      this._setPrintArea();
    } else {
      // dico al mapservice di fermare il disegno del print area
      this._mapService.stopDrawGreyCover();
      // vado a ripulire tutti le cose legate al print
      this._clearPrintService();
    }
  };


}

inherit(PrintComponentService, G3WObject);

module.exports = PrintComponentService;