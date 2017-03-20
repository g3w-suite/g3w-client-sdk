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
  // mi dice se è stato inizilizzato o meno
  this._initialized = false;
  // inizializzo lo state
  this.state = {};
  this._moveMapKeyEvent = null;
  // istanzio il componete page per la visualizzazione del pdf
  this._page = null;
  this._mapService = null;
  this._map = null;
  this._isOpen = false;
  // oggetto che va a mappare scale e risoluzione
  // si aggiornerà via via che verranno fatti zoom in e zoom out
  // tramite l'evento moveend
  this._scalesResolutions = {};
  // inizializzazione
  this.init = function() {
    // recupero il project
    this._project = ProjectsRegistry.getCurrentProject();
    // prendo le informazioni del print
    this.state.print = this._project.state.print;
    // setto lo state visible
    this.state.visible = (this.state.print && this.state.print.length) ? true : false;
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
      this.state.map = null;//;this.state.print[0].maps[0].name;
      this.state.width = null;//this.state.print[0].maps[0].w;
      this.state.height = null;//this.state.print[0].maps[0].h;
    }
  };
  // metodo per il cambio di template
  this.changeTemplate = function() {
    var self = this;
    if (!this.state.template) return;
    var template = this.state.template;
    _.forEach(this.state.print, function(print) {
      if (print.name == template) {
        // al momento hardcoded mpa0
        self.state.width = print.maps[0].w;
        self.state.height = print.maps[0].h;
        self.state.map = print.maps[0].name;
      }
    });
    this._setPrintArea();
  };

  // metodo per il cambio di scala attraverso la select
  this.changeScale = function() {
    if (!this.state.scala) return;
    // vado a cambiare la print area
    this._setPrintArea();
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
      scale: this.state.scala, // scala scelta
      extent: this.state.inner.join(), // estensione
      rotation: this.state.rotation, // rotazione
      dpi: this.state.dpi,// dpi
      template: this.state.template, // nome template
      map: this.state.map // tipo mappa (sempre map0)
    };
    return options;
  };

  // funzione print
  this.print = function() {
    var self = this;
    this._page = new PrintPage({
      service: self
    });
    var options = this._getOptionsPrint();
    PrintService.print(options)
    .then(function(url) {
      self.state.url = url;
      GUI.setContent({
        content: self._page,
        title: 'Stampa',
        perc:100
      });
    })
  };

  this._calculateInternalPrintExtent = function(resolution) {
    // rapporto tra largheza e altezza della mappa nel template
    var rapportoMappaTemplate = this.state.width/this.state.height;
    // rapporto larghezza e altezza della mappa nel client (viewport)
    var rapportoMappaClient = this.state.size[0]/this.state.size[1];
    var width, height;
    if (rapportoMappaClient > 1) { // mappa orizzontale
      if (rapportoMappaTemplate > 1) {
        if (rapportoMappaTemplate > rapportoMappaClient) {
          width = this.state.size[0] / 2; // numero di pixel raggio larghezza
        } else {
          width = (this.state.size[0] * (rapportoMappaTemplate/rapportoMappaClient))/2;
        }
        // setto un padding
        width = width - parseInt(width/10);

        height = width / rapportoMappaTemplate; // numero di pixel raggio altezza
      } else {
        height = this.state.size[1] / 2; // numero di pixel raggio larghezza
        // setto un padding
        height = height - parseInt(height/10);
        width = height * rapportoMappaTemplate ; // numero di pixel raggio altezza
      }
    } else { // mappa verticale
      if (rapportoMappaTemplate > 1) {
        width = this.state.size[0] / 2; // numero di pixel raggio larghezza
        // setto un padding
        width = width - parseInt(width/10);

        height = width / rapportoMappaTemplate; // numero di pixel raggio altezza
      } else {
        if (rapportoMappaTemplate < rapportoMappaClient) {
          height = this.state.size[1] / 2; // numero di pixel raggio larghezza
        } else {
          height = (this.state.size[1] * (rapportoMappaClient/rapportoMappaTemplate))/2;
        }
        // setto un padding
        height = height - parseInt(height/10);
        width = height * rapportoMappaTemplate ; // numero di pixel raggio altezza
      }
    }
    // vado a calcolare la x_min e x_max
    x_min = this.state.center[0] - (width*resolution);
    x_max = this.state.center[0] + (width*resolution);
    // vado a caloclare la y_min e y_max
    y_min = this.state.center[1] - (height*resolution);
    y_max = this.state.center[1] + (height*resolution);
    this.state.inner =  [x_min, y_min, x_max, y_max];
  };

  // funzione che setta il BBOX della printArea
  this._setPrintArea = function() {
    // size della mappa
    this.state.size = this._map.getSize();
    this.state.currentScala = resToScale(this._map.getView().getResolution());
    // centro della mappa
    this.state.center = this._map.getView().getCenter();
    // vado a prendere la risoluzione dell'area
    var resolution = scaleToRes(this.state.scala);
    this._calculateInternalPrintExtent(resolution);
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner,
      rotation: this.state.rotation
    });
  };

  // metodo chiusura print panel
  this._clearPrint = function() {
    // rimovo l'evento movend della mappa
    ol.Observable.unByKey(this._moveMapKeyEvent);
    // lo setto a null
    this._moveMapKeyEvent = null;
    // dico al mapservice di fermare il disegno del print area
    this._mapService.stopDrawGreyCover();
  };

  // funzione che fa il change dell'ouput pdf quando
  // ci spostiamo nella mappa o cambiano i parametri del print
  // al momento non usata
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

  // la funzione mi serve per adattare le scale da visulzizzare in base alle
  // varie risoluzione della mappa basate su maResolution della view
  this._setAllScalesBasedOnMaxResolution = function(maxResolution) {
    var self = this;
    var resolution = maxResolution;
    var mapScala = resToScale(resolution);
    // ordino le scale dal più grande al più piccolo
    var orderScales = _.orderBy(this.state.scale, ['value'], ['desc']);
    var scale = [];
    _.forEach(orderScales, function(scala) {
      if (mapScala > scala.value) {
        scale.push(scala);
        resolution = scaleToRes(scala.value);
        self._scalesResolutions[scala.value] = resolution;
        resolution = resolution / 2;
      }
    });
    // riordino in modo crescente
    this.state.scale = _.orderBy(scale, ['value'], ['asc']);
  };

  // funzione che mi restituisce la scala da settare inizialmente
  this._setInitialScalaSelect = function() {
    var self = this;
    // prendo la risoluzione della mappa
    var initialResolution = this._map.getView().getResolution();
    // ci calcolo la scala associata alla resoluzione iniziale della mappa
    var initialScala = resToScale(initialResolution);
    var found = false;
    _.forEach(this.state.scale, function(scala, index) {
      // qui vado a settare la scala in base alla risoluzione inziale della mappa
      if (initialScala < scala.value && !self.state.scala) {
        var idx = index ? index -1 : index;
        self.state.scala = self.state.scale[idx].value;
        $('#scala').val(self.state.scala);
        found = true;
        return false
      }
    });
    if (!found) {
      this.state.scala = this.state.scale[this.state.scale.length-1].value;
    }
  };

  //setta la scala in base alla risoluzione
  this._setCurrentScala = function(resolution) {
    var self = this;
    _.forEach(this._scalesResolutions, function(res, scala) {
      if (res == resolution) {
        self.state.scala = scala;
        return false
      }
    });
  };

  // funzione che ha lo scopo di settare il moveend della mappa
  this._setMoveendMapEvent = function() {
    var self = this;
    // prendo la chiave dell'evento moveend
    this._moveMapKeyEvent = this._map.on('moveend', function() {
      /// setto nella select la scala corrispondente
      // vado a settare la print area
      self._setPrintArea();
    })
  };

  //funzione che setta l'area iniziale
  this._showPrintArea = function() {
    // vado ad impostare l'area di stampa
    this._setPrintArea();
    // dico al mapservice di disegnare l'area di stampa
    this._mapService.startDrawGreyCover();
  };


  // funzione che setta la massima e iniziale scala del progetto
  this._initPrintConfig = function() {
    var resolution;
    if (!this._initialized) {
      // prendo la massima risoluzione della mappa
      var maxResolution = this._map.getView().getMaxResolution();
      // ricavo le scale adatte alle mie risoluzioni
      this._setAllScalesBasedOnMaxResolution(maxResolution);
      //se non è stata ancora inizializzata allora vado a settare
      // setto la scala iniziale nella select in base alla risoluzione di partenza del progetto
      this._setInitialScalaSelect();
      //dico che è stata inzializzata
      this._initialized = true;
    } else {
      // prendo la risoluzione corrente
      resolution = this._map.getView().getResolution();
      // vado a cambiare la scala
      this._setCurrentScala(resolution);
    }
  };

  // funzione che ricava sempre map0
  this._setMapInfo = function() {
    var self = this;
    _.forEach(this.state.print[0].maps, function(map) {
      if (map.name == 'map0') {
        self.state.map = map.name;
        self.state.width = map.w;
        self.state.height = map.h;
        return false;
      }
    })
  };

  // metodo per la visualizzazione dell'area grigia o meno
  // chamata dal metodo _setOpen del componente
  this.showPrintArea = function(bool) {
    this._mapService = GUI.getComponent('map').getService();
    this._map = this._mapService.viewer.map;
    if (bool) {
      this._setMapInfo();
      // registo il moveend map event
      this._setMoveendMapEvent();
      // setto la scala iniziale derivato dalle proprietà della mappa
      // e limito la selezione delle scale
      this._initPrintConfig();
      // setto la area di print
      this._showPrintArea();
    } else {
      // vado a ripulire tutti le cose legate al print
      this._clearPrint();
    }
  };

  this.reload = function() {
    var self = this;
    this._project = ProjectsRegistry.getCurrentProject();
    this._mapService = GUI.getComponent('map').getService();
    this._map = this._mapService.viewer.map;
    // prendo le informazioni del print
    this.state.print = this._project.state.print;
    // setto lo state visible
    this.state.visible = (this.state.print && this.state.print.length) ? true : false;
    //verifico se è visibile nel senso se ci sono informazioni
    //sul print per quel progetto
    if (this.state.visible) {
      this.state.template = this.state.print[0].name;
      // setto la area di print
      if (!this._initialized) {
        this.init();
      }
      this._initPrintConfig();
      this._mapService.on('changeviewaftercurrentproject', function() {
        var maxResolution = self._map.getView().getMaxResolution();
        // ricavo le scale adatte alle mie risoluzioni
        self.state.scale = scale;
        self._setAllScalesBasedOnMaxResolution(maxResolution);
      });
    } else {
      // vado a ripulire tutti le cose legate al print
      this._clearPrint();
    }
  }
}

inherit(PrintComponentService, G3WObject);

module.exports = PrintComponentService;