const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const ProjectsRegistry = require('core/project/projectsregistry');
const PrintService = require('core/print/printservice');
const resToScale = require('core/utils/geo').resToScale;
const scaleToRes = require('core/utils/geo').scaleToRes;
const printConfig = require('./printconfig');
const PrintPage = require('./vue/printpage');
const scale = printConfig.scale;
const dpis = printConfig.dpis;

function PrintComponentService() {
  base(this);
  this._initialized = false;
  this.state = {};
  this._moveMapKeyEvent = null;
  // istanzio il componete page per la visualizzazione del pdf
  this._page = null;
  this._mapService = null;
  this._map = null;
  this._isOpen = false;
  this._scalesResolutions = {};
  this.init = function() {
    this._project = ProjectsRegistry.getCurrentProject();
    this.state.print = this._project.state.print;
    this.state.visible = (this.state.print && this.state.print.length) ? true : false;
    this.state.isShow = false;
    this.state.loading = false;
    this.state.url = null;
    if (this.state.visible) {
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
  this.changeTemplate = function() {
    if (!this.state.template) return;
    const template = this.state.template;
    this.state.print.forEach((print) => {
      if (print.name == template) {
        this.state.width = print.maps[0].w;
        this.state.height = print.maps[0].h;
        this.state.map = print.maps[0].name;
      }
    });
    this._setPrintArea();
  };
  
  this.changeScale = function() {
    if (!this.state.scala) return;
    this._setPrintArea();
  };

  this.changeRotation = function() {
    this._mapService.setInnerGreyCoverBBox({
      rotation: this.state.rotation
    });
    this._changePrintOutput();
  };

  this._getOptionsPrint = function() {
    const options = {
      scale: this.state.scala, 
      extent: this.state.inner.join(), 
      rotation: this.state.rotation, 
      dpi: this.state.dpi,// dpi
      template: this.state.template, 
      map: this.state.map //(map0)
    };
    return options;
  };

  this.print = function() {
    this._page = new PrintPage({
      service: this
    });
    const options = this._getOptionsPrint();
    GUI.setContent({
      content: this._page,
      title: 'Stampa',
      perc:100
    });
    PrintService.print(options)
    .then((data, status, xhr) => {
      this.state.url = this.url;
    })
    .fail(() => {
      GUI.notify.error('Si è verificato un errore nella richiesta al server');
      GUI.closeContent();
    })
  };

  this._calculateInternalPrintExtent = function() {
    const resolution = this._map.getView().getResolution();
    const scala = parseFloat(this.state.scala);
    const w = this.state.width / 1000.0 * scala / resolution * ol.has.DEVICE_PIXEL_RATIO;
    const h = this.state.height  / 1000.0 * scala / resolution * ol.has.DEVICE_PIXEL_RATIO;
    const center = [this.state.size[0] * ol.has.DEVICE_PIXEL_RATIO / 2 , this.state.size[1] * ol.has.DEVICE_PIXEL_RATIO / 2];

    const xmin = center[0] - (w / 2); 
    const ymin = center[1] - (h / 2);
    const xmax = center[0] + (w / 2);
    const ymax = center[1] + (h / 2);
    
    x_min = this._map.getCoordinateFromPixel([xmin, ymax]);
    x_max = this._map.getCoordinateFromPixel([xmax, ymax]);
    y_min = this._map.getCoordinateFromPixel([xmin, ymin]);
    y_max = this._map.getCoordinateFromPixel([xmax, ymin]);
    this.state.inner =  [x_min[0], x_min[1], y_max[0], y_max[1]];

  };
  
  this._setPrintArea = function() {
    this.state.size = this._map.getSize();
    this.state.currentScala = resToScale(this._map.getView().getResolution());
    this.state.center = this._map.getView().getCenter();
    this._calculateInternalPrintExtent();
    this._mapService.setInnerGreyCoverBBox({
      inner: this.state.inner,
      rotation: this.state.rotation
    });
  };

  this._clearPrint = function() {
    ol.Observable.unByKey(this._moveMapKeyEvent);
    this._moveMapKeyEvent = null;
    this._mapService.stopDrawGreyCover();
  };
  
  this._changePrintOutput = function() {
    if (this.state.isShow) {
      this.state.loading = true;
      const options = this._getOptionsPrint();
      PrintService.print(options)
        .then((url) => {
          if (this.state.url == url) {
            this.state.loading = false;
          }
          this.state.url = url;
        })
    }
  };
  
  this._setAllScalesBasedOnMaxResolution = function(maxResolution) {
    let resolution = maxResolution;
    const mapScala = resToScale(resolution);
    const orderScales = _.orderBy(this.state.scale, ['value'], ['desc']);
    let scale = [];
    orderScales.forEach((scala) => {
      if (mapScala > scala.value) {
        scale.push(scala);
        resolution = scaleToRes(scala.value);
        this._scalesResolutions[scala.value] = resolution;
        resolution = resolution / 2;
      }
    });
    this.state.scale = _.orderBy(scale, ['value'], ['asc']);
  };
  
  this._setInitialScalaSelect = function() {
    const initialResolution = this._map.getView().getResolution();
    const initialScala = resToScale(initialResolution);
    let found = false;
    this.state.scale.forEach((scala, index) => {
      if (initialScala < scala.value && !this.state.scala) {
        const idx = index ? index -1 : index;
        this.state.scala = this.state.scale[idx].value;
        $('#scala').val(this.state.scala);
        found = true;
        return false
      }
    });
    if (!found) {
      this.state.scala = this.state.scale[this.state.scale.length-1].value;
    }
  };
  
  this._setCurrentScala = function(resolution) {
    Object.entries(this._scalesResolutions).forEach(([scala, res]) => {
      if (res == resolution) {
        this.state.scala = scala;
        return false
      }
    });
  };

  this._setMoveendMapEvent = function() {
    this._moveMapKeyEvent = this._map.on('moveend', () => {
      this._setPrintArea();
    })
  };
  
  this._showPrintArea = function() {
    this._setPrintArea();
    this._mapService.startDrawGreyCover();
  };
  
  this._initPrintConfig = function() {
    let resolution;
    if (!this._initialized) {
      const maxResolution = this._map.getView().getMaxResolution();
      this._setAllScalesBasedOnMaxResolution(maxResolution);
      this._setInitialScalaSelect();
      this._initialized = true;
    } else {
      resolution = this._map.getView().getResolution();
      this._setCurrentScala(resolution);
    }
  };

  this._setMapInfo = function() {
    this.state.print[0].maps.forEach((map) => {
      if (map.name == 'map0') {
        this.state.map = map.name;
        this.state.width = map.w;
        this.state.height = map.h;
        return false;
      }
    })
  };
  
  this.showPrintArea = function(bool) {
    this._mapService = GUI.getComponent('map').getService();
    this._map = this._mapService.viewer.map;
    if (bool) {
      this._setMapInfo();
      this._setMoveendMapEvent();
      this._initPrintConfig();
      this._showPrintArea();
    } else {
      this._clearPrint();
    }
  };

  this.reload = function() {
    this._project = ProjectsRegistry.getCurrentProject();
    this._mapService = GUI.getComponent('map').getService();
    this._map = this._mapService.viewer.map;
    this.state.print = this._project.state.print;
    this.state.visible = (this.state.print && this.state.print.length) ? true : false;
    if (this.state.visible) {
      this.state.template = this.state.print[0].name;
      if (!this._initialized) {
        this.init();
      }
      this._initPrintConfig();
      this._mapService.on('changeviewaftercurrentproject', () => {
        const maxResolution = this._map.getView().getMaxResolution();
        this.state.scale = scale;
        this._setAllScalesBasedOnMaxResolution(maxResolution);
      });
    } else {
      this._clearPrint();
    }
  }
}

inherit(PrintComponentService, G3WObject);

module.exports = PrintComponentService;
