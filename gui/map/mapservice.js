var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var ApplicationService = require('core/applicationservice');
var ProjectsRegistry = require('core/project/projectsregistry');
var Layer = require('core/layers/layer');
var ol3helpers = require('g3w-ol3/src/g3w.ol3').helpers;
var WMSLayer = require('core/map/layer/wmslayer');
var VectorLayer = require('core/map/layer/vectorlayer');
var ControlsFactory = require('gui/map/control/factory');
var QueryService = require('core/query/queryservice');
var StreetViewService = require('gui/streetview/streetviewservice');
var ControlsRegistry = require('gui/map/control/registry');
var LayersRegistry = require('core/layers/layersregistry');


function MapService(options) {
  var self = this;
  this.viewer;
  this.target;
  this.project;
  this.selectedLayer;
  this._mapControls = [];
  this._mapLayers = [];
  this.mapBaseLayers = {};
  this.layersExtraParams = {};
  this.state = {
      bbox: [],
      resolution: null,
      center: null,
      loading: false,
      hidden: true
  };

  this._greyListenerKey = null;
  this._drawShadow = {
    type: 'coordinate',
    outer: [],
    inner: [],
    scale: null,
    rotation: null
  };
  this.config = options.config || ApplicationService.getConfig();
  this._howManyAreLoading = 0;
  this._incrementLoaders = function(){
    if (this._howManyAreLoading == 0){
      this.emit('loadstart');
      GUI.showSpinner({
        container: $('#map-spinner'),
        id: 'maploadspinner',
        style: 'blue'
      });
    }
    this._howManyAreLoading += 1;
  };
  
  this._decrementLoaders = function(){
    this._howManyAreLoading -= 1;
    if (this._howManyAreLoading == 0){
      this.emit('loadend');
      GUI.hideSpinner('maploadspinner');
    }
  };

  if(!_.isNil(options.project)) {
    this.project = options.project;
  } else {
    this.project = ProjectsRegistry.getCurrentProject();
    ProjectsRegistry.onafter('setCurrentProject',function(project){
      self.project = project;
      self.setupLayers();
      self._resetView();
    })
  }
  this._marker = null;

  this.setters = {
    setMapView: function(bbox, resolution, center) {
      this.state.bbox = bbox;
      this.state.resolution = resolution;
      this.state.center = center;
      this.updateMapLayers(this._mapLayers);
    },
    setHidden: function(bool) {
      this.state.hidden = bool;
    },
    setupViewer: function(width,height){
      if (width == 0 || height == 0) {
        return
      }
      proj4.defs("EPSG:"+self.project.state.crs,this.project.state.proj4);
      if (self.viewer) {
        self.viewer.destroy();
        self.viewer = null;
      }
      self._setupViewer(width, height);
      self.state.bbox = this.viewer.getBBOX();
      self.state.resolution = this.viewer.getResolution();
      self.state.center = this.viewer.getCenter();
      self.setupControls();
      self.setupLayers();
      self.emit('viewerset');
    },
    controlClick: function() {

    }
  };

  this._resetView = function() {
    var width = this.viewer.map.getSize()[0];
    var height = this.viewer.map.getSize()[1];
    var extent = this.project.state.extent;
    var maxxRes = ol.extent.getWidth(extent) / width;
    var minyRes = ol.extent.getHeight(extent) / height;
    var maxResolution = Math.max(maxxRes,minyRes) > this.viewer.map.getView().getMaxResolution() ? Math.max(maxxRes,minyRes): this.viewer.map.getView().getMaxResolution();
    var view = new ol.View({
      extent: extent,
      projection: this.viewer.map.getView().getProjection(),
      center: this.viewer.map.getView().getCenter(),
      resolution: this.viewer.map.getView().getResolution(),
      maxResolution: maxResolution
    });
    this.viewer.map.setView(view);
  };

  // funzione che setta la view basata sulle informazioni del progetto
  this._setupViewer = function(width,height) {
    var self = this;
    var projection = this.getProjection();
    // ricavo l'estensione iniziale del progetto)
    var initextent = this.project.state.initextent;
    // ricavo l'estensione del progetto
    var extent = this.project.state.extent;

    var maxxRes = ol.extent.getWidth(extent) / width;
    var minyRes = ol.extent.getHeight(extent) / height;
    // calcolo la massima risoluzione
    var maxResolution = Math.max(maxxRes,minyRes);

    var initxRes = ol.extent.getWidth(initextent) / width;
    var inityRes = ol.extent.getHeight(initextent) / height;
    var initResolution = Math.max(initxRes,inityRes);

    this.viewer = ol3helpers.createViewer({
      id: this.target,
      view: {
        projection: projection,
        /*center: this.config.initcenter || ol.extent.getCenter(extent),
        zoom: this.config.initzoom || 0,
        extent: this.config.constraintextent || extent,
        minZoom: this.config.minzoom || 0, // default di OL3 3.16.0
        maxZoom: this.config.maxzoom || 28 // default di OL3 3.16.0*/
        center: ol.extent.getCenter(initextent),
        extent: extent,
        //minZoom: 0, // default di OL3 3.16.0
        //maxZoom: 28 // default di OL3 3.16.0
        maxResolution: maxResolution
      }
    });
    
    if (this.config.background_color) {
      $('#' + this.target).css('background-color', this.config.background_color);
    }
    
    $(this.viewer.map.getViewport()).prepend('<div id="map-spinner" style="position:absolute;right:0px;"></div>');
    
    this.viewer.map.getInteractions().forEach(function(interaction){
      self._watchInteraction(interaction);
    });
    
    this.viewer.map.getInteractions().on('add',function(interaction){
      self._watchInteraction(interaction.element);
    });
    
    this.viewer.map.getInteractions().on('remove',function(interaction){
      //self._onRemoveInteraction(interaction);
    });

    this.viewer.map.getView().setResolution(initResolution);

    this.viewer.map.on('moveend',function(e) {
      self._setMapView();
    });

    this._marker = new ol.Overlay({
      position: undefined,
      positioning: 'center-center',
      element: document.getElementById('marker'),
      stopEvent: false
    });

    this.viewer.map.addOverlay(this._marker);

    this.emit('ready');
  };
  
  LayersRegistry.onafter('setLayersVisible',function(layersIds){
    var mapLayers = _.map(layersIds,function(layerId){
      var layer = LayersRegistry.getLayerById(layerId);
      return self.getMapLayerForLayer(layer);
    });
    self.updateMapLayers(self.getMapLayers());
  });
  
  this.project.onafter('setBaseLayer',function(){
    self.updateMapLayers(self.mapBaseLayers);
  });


  this.on('cataloglayerselected', function() {
   var self = this;
   var layer = LayersRegistry.getLayers({
      SELECTED: true
    });
   if (layer) {
     this.selectLayer = layer[0];
     _.forEach(this._mapControls, function(mapcontrol) {
       if (_.indexOf(_.keysIn(mapcontrol.control), 'onSelectLayer') > -1 && mapcontrol.control.onSelectLayer()) {
         if (mapcontrol.control.getGeometryTypes().indexOf(self.selectLayer.getGeometryType()) > -1 ) {
           mapcontrol.control.setEnable(true);
         } else {
           mapcontrol.control.setEnable(false);
         }
       }
     })
   }
  });

  this.on('cataloglayerunselected', function() {
    this.selectLayer = null;
    _.forEach(this._mapControls, function(mapcontrol) {
      if (_.indexOf(_.keysIn(mapcontrol.control),'onSelectLayer') > -1 && mapcontrol.control.onSelectLayer()) {
        mapcontrol.control.setEnable(false);
      }
    })
  });
  
  base(this);
}


inherit(MapService, G3WObject);

var proto = MapService.prototype;

// rende questo mapservice slave di un altro MapService
proto.slaveOf = function(mapService, sameLayers){
  // se impostare i layer iniziali uguali a quelli del mapService master
  var sameLayers = sameLayers || false;
};

proto.setLayersExtraParams = function(params,update){
  this.layersExtraParams = _.assign(this.layersExtraParams,params);
  this.emit('extraParamsSet',params,update);
};

proto.getProject = function() {
  return this.project;
};

proto.getMap = function() {
  return this.viewer.map;
};

// funzione che server per definire una proiezione non standard
proto.defineProjection = function(crs) {
  switch(crs) {
    case '3003':
      proj4.defs("EPSG:" + crs, "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs");
      break;
  }
};

proto.getProjection = function() {
  var extent = this.project.state.extent;
  var projection = new ol.proj.Projection({
    code: "EPSG:"+this.project.state.crs,
    extent: extent
  });
  return projection;
};

proto.getCrs = function() {
  return this.project.state.crs;
};

proto.getViewerElement = function(){
  return this.viewer.map.getTargetElement();
};

proto.getViewport = function(){
  return this.viewer.map.getViewport();
};

proto.getResolution = function() {
  return this.viewer.map.getView().getResolution();
};

proto.getEpsg = function() {
  return this.viewer.map.getView().getProjection().getCode();
};

proto.getGetFeatureInfoUrlForLayer = function(layer,coordinates,resolution,epsg,params) {
  var mapLayer = this.getMapLayerForLayer(layer);
  return mapLayer.getGetFeatureInfoUrl(coordinates,resolution,epsg,params);
};

proto.showMarker = function(coordinates, duration) {
  duration = duration || 1000;
  var self = this;
  this._marker.setPosition(coordinates);
  setTimeout(function(){
    self._marker.setPosition();
  }, duration)
};

// ritorna il layer nella mappa in base al name
proto.getLayerByName = function(name) {
  var map = this.viewer.map;
  var layer = null;
  map.getLayers().forEach(function(lyr) {
    if (lyr.get('name') == name) {
      layer = lyr;
      return false
    }
  });
  return layer;
};

// ritorna il layer della mappa in base all'id
proto.getLayerById = function(id) {
  var map = this.viewer.map;
  var layer = null;
  map.getLayers().forEach(function(lyr) {
    if (lyr.get('id') == id) {
      layer = lyr;
      return false
    }
  });
  return layer;
};


proto.setupControls = function(){
  var self = this;
  if (this.config && this.config.mapcontrols) {
    _.forEach(this.config.mapcontrols, function(controlType) {
      var control;
      switch (controlType) {
        case 'reset':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
          }
          self.addControl(controlType,control);
          break;
        case 'zoom':
          control = ControlsFactory.create({
            type: controlType,
            zoomInLabel: "\ue98a",
            zoomOutLabel: "\ue98b"
          });
          self.addControl(controlType,control);
          break;
        case 'zoombox':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('zoomend', function (e) {
              self.viewer.fit(e.extent);
            });
            self.addControl(controlType,control);
          }
          break;
        case 'zoomtoextent':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType,
              label: "\ue98c",
              extent: self.project.state.initextent
            });
            self.addControl(controlType,control);
          }
          break;
        case 'query':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('picked', function(e) {
            var coordinates = e.coordinates;
            self.showMarker(coordinates);
            var showQueryResults = GUI.showContentFactory('query');
            var layers = LayersRegistry.getLayers({
              QUERYABLE: true,
              SELECTEDORALL: true
            });
            var queryPromises = [];// raccoglie tutte le promises dei provider del layer
            _.forEach(layers, function(layer) {
              queryPromises.push(layer.getFeatures({
                method: 'query',
                params: {
                  coordinates: coordinates
                }
              }))
            });
            //faccio query by location su i layers selezionati o tutti
            var queryResultsPanel = showQueryResults('interrogazione');
            $.when.apply(this, queryPromises)
              .then(function(results) {
                queryResultsPanel.setQueryResponse(results,coordinates,self.state.resolution);
                })
              .fail(function() {
                GUI.notify.error('Si è verificato un errore nella richiesta al server');
                GUI.closeContent();
              })
            // QueryService.queryByLocation(coordinates, layers)
            // .then(function(results) {
            //   queryResultsPanel.setQueryResponse(results,coordinates,self.state.resolution);
            // })
            // .fail(function() {
            //   GUI.notify.error('Si è verificato un errore nella richiesta al server');
            //   GUI.closeContent();
            // })
          });
          self.addControl(controlType,control);
          break;
        case 'querybypolygon':
          var controlLayers = LayersRegistry.getLayers({
            QUERYABLE: true,
            SELECTEDORALL: true
          });
          control = ControlsFactory.create({
            type: controlType,
            layers: controlLayers
          });
          if (control) {
            control.on('picked', function (e) {
              var coordinates = e.coordinates;
              var showQueryResults = GUI.showContentFactory('query');
              //faccio query by location su i layers selezionati o tutti
              var queryResultsPanel = showQueryResults('interrogazione');
              var layers = LayersRegistry.getLayers({
                QUERYABLE: true,
                SELECTED: true
              });
              QueryService.queryByLocation(coordinates, layers)
                .then(function (results) {
                  if (results && results.data && results.data[0].features.length) {
                    var geometry = results.data[0].features[0].getGeometry();
                    var queryLayers = LayersRegistry.getLayers({
                      QUERYABLE: true,
                      ALLNOTSELECTED: true,
                      WFS: true
                    });
                    self.highlightGeometry(geometry);
                    var filterObject = QueryService.createQueryFilterObject({
                      queryLayers: queryLayers,
                      ogcService: 'wfs',
                      filter: {
                        geometry: geometry
                      }
                    });
                    QueryService.queryByFilter(filterObject)
                      .then(function (results) {
                        queryResultsPanel.setQueryResponse(results, geometry, self.state.resolution);
                      })
                      .fail(function() {
                        GUI.notify.error('Si è verificato un errore nella richiesta al server');
                        GUI.closeContent();
                      })
                      .always(function () {
                        self.clearHighlightGeometry();
                      });
                  }
                })
                .fail(function() {
                  GUI.notify.error('Si è verificato un errore nella richiesta al server');
                  GUI.closeContent();
                })
            });
            self.addControl(controlType, control);
          }
          break;
        case 'querybbox':
          if (!isMobile.any && self.checkWFSLayers()) {
            var controlLayers = LayersRegistry.getLayers({
              QUERYABLE: true,
              SELECTEDORALL: true,
              WFS: true
            });
            control = ControlsFactory.create({
              type: controlType,
              layers: controlLayers
            });
            if (control) {
              control.on('bboxend', function (e) {
                var bbox = e.extent;
                var layers = LayersRegistry.getLayers({
                  QUERYABLE: true,
                  SELECTEDORALL: true,
                  WFS: true
                });
                var showQueryResults = GUI.showContentFactory('query');
                //faccio query by location su i layers selezionati o tutti
                var queryResultsPanel = showQueryResults('interrogazione');
                var filterObject = QueryService.createQueryFilterObject({
                  queryLayers: layers,
                  ogcService: 'wfs',
                  filter: {
                    bbox: bbox
                  }
                });
                QueryService.queryByFilter(filterObject)
                  .then(function (results) {
                    queryResultsPanel.setQueryResponse(results, bbox, self.state.resolution);
                  })
                  .fail(function() {
                    GUI.notify.error('Si è verificato un errore nella richiesta al server');
                    GUI.closeContent();
                  })
              });
              self.addControl(controlType, control);
            }
          }
          break;
        case 'streetview':
          // streetview
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.setProjection(self.getProjection());
            self.addControl(controlType, control);
            self.on('viewerset', function() {
              self.viewer.map.addLayer(control.getLayer());
            });
            $script("https://maps.googleapis.com/maps/api/js?key=AIzaSyBCHtKGx3yXWZZ7_gwtJKG8a_6hArEFefs",
              function() {
                var position = {
                  lat: null,
                  lng: null
                };
                var streetViewService = new StreetViewService();
                streetViewService.onafter('postRender', function(position) {
                  control.setPosition(position);
                });
                if (control) {
                  control.on('picked', function(e) {
                    var coordinates = e.coordinates;
                    var lonlat = ol.proj.transform(coordinates, self.getProjection().getCode(), 'EPSG:4326');
                    position.lat = lonlat[1];
                    position.lng = lonlat[0];
                    streetViewService.showStreetView(position);
                  });
                  control.on('disabled', function() {
                    if (panorama) {
                      panorama = null;
                    }
                  })
                }
              }
            )
          }
          break;
        case 'scaleline':
          control = ControlsFactory.create({
            type: controlType,
            position: 'br'
          });
          self.addControl(controlType,control);
          break;
        case 'overview':
          if (!isMobile.any) {
            var overviewProjectGid = self.project.getOverviewProjectGid();
            if (overviewProjectGid) {
              ProjectsRegistry.getProject(overviewProjectGid)
              .then(function(project){
                var overViewMapLayers = self.getOverviewMapLayers(project);
                control = ControlsFactory.create({
                  type: controlType,
                  position: 'bl',
                  className: 'ol-overviewmap ol-custom-overviewmap',
                  collapseLabel: $('<span class="glyphicon glyphicon-menu-left"></span>')[0],
                  label: $('<span class="glyphicon glyphicon-menu-right"></span>')[0],
                  collapsed: false,
                  layers: overViewMapLayers,
                  view: new ol.View({
                    projection: self.getProjection()
                  })
                });
                self.addControl(controlType,control);
              });
            }
          }
          break;
        case 'nominatim':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('addresschosen', function (evt) {
            var coordinate = evt.coordinate;
            var geometry =  new ol.geom.Point(coordinate);
            self.highlightGeometry(geometry);
          });
          self.addControl(controlType,control);
          $('#search_nominatim').click(function() {
            control.nominatim.query($('input.gcd-txt-input').val());
          });
          $('.gcd-txt-result').perfectScrollbar();
          break;
        case 'geolocation':
          // nel caso in cui esista il geolocation control o siamo sul mobile
          if (!isMobile.any) {
            // creo il controllo
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('click', function(evt) {
              self.showMarker(evt.coordinates);
            });
            control.on('error', function(e) {
              GUI.notify.error('Non è possibile calcolare la tua posizione. Si è verificato un errore di connessione al server')
            });
            self.addControl(controlType, control);
          }
          break;
        case 'addlayers':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('addlayer', function() {
              self.emit('addexternallayer');
            });
            self.addControl(controlType, control);
          }
          break;
        case 'length':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            self.addControl(controlType, control);
          }
          break;
        case 'area':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            self.addControl(controlType, control);
          }
          break;
      }
    });
  }
};
// verifica se esistono layer querabili che hanno wfs capabilities
proto.checkWFSLayers = function() {
  var iswfs = false;
  var layers = LayersRegistry.getLayers({
    QUERYABLE: true,
    SELECTEDORALL: true
  });
  _.forEach(layers, function(layer) {
    if (layer.getWfsCapabilities()) {
      iswfs = true;
      return false
    }
  });
  return iswfs
};

proto.addControl = function(type, control) {
  var self = this;
  // verico che il controllo abbia la funzione on selectLayer
  if (_.indexOf(_.keysIn(control),'onSelectLayer') > -1 && control.onSelectLayer()) {
    if (!this.selectLayer) {
      control.setEnable(false);
    }
  }
  this.viewer.map.addControl(control);
  this._mapControls.push({
    type: type,
    control: control,
    visible: true
  });
  control.on('controlclick', function() {
    self.controlClick();
  });
  // vado a registrare il controllo aggiunto
  ControlsRegistry.registerControl(type, control);
};

// mostra uno dei controlli disponibili (ovvero già istanziati in base alla configurazione)
proto.showControl = function(type) {
  this.showControls([type]);
};

// nasconde uno dei controlli disponibili (ovvero già istanziati in base alla configurazione)
proto.hideControl = function(type) {
  this.hideControls([type]);
};

// come sopra ma per un array di tipi di controlli. Es. mapService.showControls(['zoombox','query'])
proto.showControls = function(types) {
  this.toggleControls(true,types);
};

// come sopra ma per un array di tipi di controlli. Es. mapService.hideControls(['zoombox','query'])
proto.hideControls = function(types) {
 this.toggleControls(false,types);
};

// riattiva tutti i controlli disponibili
proto.showAllControls = function() {
  this.toggleControls(true);
};

// rimuove tutti i controlli
proto.hideAllControls = function() {
  this.toggleControls(false);
};

proto.toggleControls = function(toggle, types) {
  var self = this;
  this._removeControls();
  _.forEach(this._mapControls,function(controlObj){
    if (types) {
      if (types.indexOf(controlObj.type) > -1) {
        controlObj.visible = toggle;
      }
    }
    else {
      controlObj.visible = toggle;
    }
  });
  this._layoutControls();
};

proto._layoutControls = function() {
  var self = this;
  _.forEach(this._mapControls,function(controlObj){
    if (controlObj.visible) {
      self.viewer.map.addControl(controlObj.control);
    }
  })
};

proto.removeControl = function(type) {
  var self = this;
  _.forEach(this._mapControls,function(controlObj, ctrlIdx) {
    if (type == controlObj.type) {
      self._mapControls.splice(ctrlIdx,1);
      self.viewer.map.removeControl(controlObj.control);
      return false;
    }
  })
};

proto._removeControls = function() {
  var self = this;
  _.forEach(this._mapControls,function(controlObj){
    self.viewer.map.removeControl(controlObj.control);
  })
};

proto._unToggleControls = function() {
  _.forEach(this._mapControls,function(controlObj){
    if (controlObj.control.toggle) {
      controlObj.control.toggle(false);
    }
  })
};

proto.addMapLayer = function(mapLayer) {
  this._mapLayers.push(mapLayer);
};

proto.getMapLayers = function() {
  return this._mapLayers;
};

proto.getMapLayerForLayer = function(layer){
  var mapLayer;
  var multilayerId = 'layer_'+layer.state.multilayer;
  _.forEach(this.getMapLayers(),function(_mapLayer){
    if (_mapLayer.getId() == multilayerId) {
      mapLayer = _mapLayer;
    }
  });
  return mapLayer;
};

proto.getProjectLayer = function(layerId) {
  return LayersRegistry.getLayerById(layerId);
};

proto.setupBaseLayers = function(){
  var self = this;
  if (!this.project.state.baselayers){
    return;
  }
  this.mapBaseLayers = {};
  var baseLayersArray = this.project.state.baselayers;
  var baseLayers = this.project.state.baselayers;
  _.forEach(baseLayers,function(layerConfig){
    var layer = new ProjectLayer(layerConfig);
    layer.setProject(this);

    if (layer.isWMS()) {
      var config = {
        url: self.project.getWmsUrl(),
        id: layer.state.id,
        tiled: layer.state.tiled
      };
      var mapLayer = new WMSLayer(config);
    }

    else {
      switch(layer.getServerType()){
        case 'OSM':
          var OSMLayer = require('core/map/layer/osmlayer');
          var mapLayer = new OSMLayer({
            id: layer.state.id
          });
          break;
        case 'Bing':
          var BingLayer = require('core/map/layer/binglayer');
          var mapLayer = new BingLayer({
            id: layer.state.id
          });
          break;
      }
    }

    self.addMapLayer(mapLayer);
    self.registerListeners(mapLayer);
    mapLayer.addLayer(layer);
    self.mapBaseLayers[layer.state.id] = mapLayer;
  });

  _.forEach(_.values(this.mapBaseLayers).reverse(),function(mapLayer){
    self.viewer.map.addLayer(mapLayer.getOLLayer());
    mapLayer.update(self.state);
  });
};

proto.setupLayers = function(){
  var self = this;
  this.viewer.removeLayers();
  this.setupBaseLayers();
  this._reset();
  // recupero i layers dal project
  // sono di tipo projectLayers
  var layers = LayersRegistry.getLayers();
  //raggruppo per valore del multilayer con chiave valore multilayer
  // e valore array
  var multiLayers = _.groupBy(layers, function(layer){
    return layer.state.multilayer;
  });
  //una volta raggruppati per multilayer dove la chiave è il valore del multilayer
  // e il valore è un array di projectLayers
  _.forEach(multiLayers, function(layers, id) {
    var multilayerId = 'layer_'+id;
    // prendo il valore tiled del primo layer (dovrebbero essere tutti uguali)
    // mi server per poter costruire il tipo di wms se tilato o meno
    var tiled = layers[0].state.tiled;
    // creo configurazione per costruire il layer wms
    var config = {
      // getWMSUrl funzione creata in fase di inizializzazione dell'applicazione
      url: self.project.getWmsUrl(),
      id: multilayerId,
      tiled: tiled
    };
    //creo il wms layer
    var mapLayer = new WMSLayer(config, self.layersExtraParams);
    // lo aggiungo alla lista dei mapLayers
    self.addMapLayer(mapLayer);
    // registo i listerns sul mapLayer costruito
    self.registerListeners(mapLayer);
    _.forEach(layers.reverse(), function(layer) {
      // per ogni layer appartenete allo stesso multilayer (è un array)
      // viene aggiunto al mapLayer (WMSLayer) perecedentemente creato
      mapLayer.addLayer(layer);
    });
  });
  // una volta creati tutti i mapLayer apparteneti alla mappa
  _.forEach(this.getMapLayers().reverse(), function(mapLayer) {
    // scorro sui mapLayer (reverse) e aggiungo alla mappa
    self.viewer.map.addLayer(mapLayer.getOLLayer());
    mapLayer.update(self.state, self.layersExtraParams);
  });
  return this.mapLayers;
};

proto.getOverviewMapLayers = function(project) {

  var projectLayers = LayersRegistry.getLayers({
    'VISIBLE': true
  });

  var multiLayers = _.groupBy(projectLayers,function(layer){
    return layer.state.multilayer;
  });
  
  var overviewMapLayers = [];
  _.forEach(multiLayers,function(layers,id){
    var multilayerId = 'overview_layer_'+id;
    var tiled = layers[0].state.tiled;
    var config = {
      url: project.getWmsUrl(),
      id: multilayerId,
      tiled: tiled
    };
    var mapLayer = new WMSLayer(config);
    _.forEach(layers.reverse(),function(layer){
      mapLayer.addLayer(layer);
    });
    overviewMapLayers.push(mapLayer.getOLLayer(true));
  });
  
  return overviewMapLayers.reverse();
};

proto.updateMapLayers = function(mapLayers) {
  var self = this;
  _.forEach(mapLayers, function(mapLayer) {
    mapLayer.update(self.state, self.layersExtraParams);
  })
};
// funzione che registra i listeners sulla creazione del mapLayers
proto.registerListeners = function(mapLayer) {

  var self = this;
  mapLayer.on('loadstart',function(){
    self._incrementLoaders();
  });
  mapLayer.on('loadend',function(){
    self._decrementLoaders(false);
  });
  
  this.on('extraParamsSet',function(extraParams,update){
    if (update) {
      mapLayer.update(this.state,extraParams);
    }
  })
};

proto.setTarget = function(elId){
  this.target = elId;
};

proto.addInteraction = function(interaction) {
  this._unToggleControls();
  this.viewer.map.addInteraction(interaction);
  interaction.setActive(true);
};

proto.removeInteraction = function(interaction){
  this.viewer.map.removeInteraction(interaction);

};

// emetto evento quando viene attivata un interazione di tipo Pointer
// (utile ad es. per disattivare/riattivare i tool di editing)
proto._watchInteraction = function(interaction) {
  var self = this;
  interaction.on('change:active',function(e) {
    if ((e.target instanceof ol.interaction.Pointer) && e.target.getActive()) {
      self.emit('pointerInteractionSet',e.target);
    }
  })
};

proto.goTo = function(coordinates,zoom) {
  var options = {
    zoom: zoom || 6
  };
  this.viewer.goTo(coordinates,options);
};

proto.goToRes = function(coordinates,resolution){
  var options = {
    resolution: resolution
  };
  this.viewer.goToRes(coordinates,options);
};

proto.goToBBox = function(bbox) {
  this.viewer.fit(bbox);
};


proto.goToWGS84 = function(coordinates,zoom){
  var coordinates = ol.proj.transform(coordinates,'EPSG:4326','EPSG:'+this.project.state.crs);
  this.goTo(coordinates,zoom);
};

proto.extentToWGS84 = function(extent){
  return ol.proj.transformExtent(extent,'EPSG:'+this.project.state.crs,'EPSG:4326');
};

proto.getResolutionForMeters = function(meters) {
  var viewport = this.viewer.map.getViewport();
  return meters / Math.max(viewport.clientWidth,viewport.clientHeight);
};

var highlightLayer = null;
var animatingHighlight = false;

proto.highlightGeometry = function(geometryObj,options) {
  var self = this;
  this.clearHighlightGeometry();
  var options = options || {};
  var zoom = (typeof options.zoom == 'boolean') ? options.zoom : true;
  var highlight = (typeof options.highlight == 'boolean') ? options.highlight : true;
  var duration = options.duration || 2000;
  var view = this.viewer.map.getView();
  
  var geometry;
  if (geometryObj instanceof ol.geom.Geometry){
    geometry = geometryObj;
  }
  else {
    var format = new ol.format.GeoJSON;
    geometry = format.readGeometry(geometryObj);
  }

  if (options.fromWGS84) {
    geometry.transform('EPSG:4326','EPSG:'+ProjectService.state.project.crs);
  }
  
  var geometryType = geometry.getType();
  if (zoom) {
    if (geometryType == 'Point' || (geometryType == 'MultiPoint' && geometry.getPoints().length == 1)) {
      var coordinates = geometryType == 'Point' ? geometry.getCoordinates() : geometry.getPoint(0).getCoordinates();
      if (this.project.state.crs != 4326 && this.project.state.crs != 3857) {
        // zoom ad una risoluzione in cui la mappa copra 100m
        var res = this.getResolutionForMeters(100);
        self.goToRes(coordinates,res);
      }
      else {
        zoom = self.viewer.map.getView().getZoom() > 6 ? self.viewer.map.getView().getZoom() : 6;
        self.goTo(coordinates, zoom);
      }
    }
    else {
      this.viewer.fit(geometry,options);
    }
  }

  if (highlight) {
    var feature = new ol.Feature({
      geometry: geometry
    });

    if (!highlightLayer) {
      highlightLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: function(feature){
          var styles = [];
          var geometryType = feature.getGeometry().getType();
          if (geometryType == 'LineString' || geometryType == 'MultiLineString') {
            var style = new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: 'rgb(255,255,0)',
                width: 4
              })
            });
            styles.push(style);
          }
          else if (geometryType == 'Point' || geometryType == 'MultiPoint') {
            var style = new ol.style.Style({
              image: new ol.style.Circle({
                radius: 6,
                fill: new ol.style.Fill({
                  color: 'rgb(255,255,0)'
                })
              }),
              zIndex: Infinity
            });
            styles.push(style);
          } else if (geometryType == 'MultiPolygon' || geometryType == 'Polygon') {
            var style = new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: 'rgb(255,255,0)',
                width: 4
              }),
              fill: new ol.style.Fill({
                color: 'rgba(255, 255, 0, 0.5)'
              })
            });
            styles.push(style);
          }
          return styles;
        }
      });
      highlightLayer.setMap(this.viewer.map);
    }

    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    if (duration) {
      animatingHighlight = true;
      setTimeout(function(){
        highlightLayer.getSource().clear();
        animatingHighlight = false;
      },duration);
    }
  }
};

proto.clearHighlightGeometry = function() {
  if (highlightLayer && ! animatingHighlight) {
    highlightLayer.getSource().clear();
  }
};

proto.refreshMap = function() {
  _.forEach(this._mapLayers, function(wmsLayer) {
    wmsLayer.getOLLayer().getSource().updateParams({"time": Date.now()});
  });
};

// funzione mi server per poter in pratica
// fare l'updatesize della mappa qundo il div che la contine cambia
// in questo modo la mappa non si streccia (chimata dalla viewport)
proto.layout = function(width, height) {
  if (!this.viewer) {
    this.setupViewer(width,height);
  }
  if (this.viewer) {
    this.setHidden((width == 0 || height == 0));
    this.getMap().updateSize();
    this._setMapView();
  }
};

proto._reset = function() {
  this._mapLayers = [];
};

proto._setMapView = function() {
  var bbox = this.viewer.getBBOX();
  var resolution = this.viewer.getResolution();
  var center = this.viewer.getCenter();
  this.setMapView(bbox, resolution, center);
};

proto.getMapSize = function() {
  var map = this.viewer.map;
  return map.getSize();
};

proto.setInnerGreyCoverScale = function(scale) {
  this._drawShadow.scale = scale;
};

proto._resetDrawShadowInner = function() {
  this._drawShadow = {
    type: 'coordinate',
    outer: [],
    inner: [],
    scale: null,
    rotation: null
  };
};

proto.setInnerGreyCoverBBox = function(options) {
  var options = options || {};
  var map = this.viewer.map;
  var type = options.type || 'coordinate'; // di solito sollo coordinate
  var inner = options.inner || null;
  var rotation = options.rotation;
  var scale = options.scale;
  var lowerLeftInner;
  var upperRightInner;
  if (inner) {
    switch (type) {
      case 'coordinate':
        lowerLeftInner = map.getPixelFromCoordinate([inner[0], inner[1]]);
        upperRightInner = map.getPixelFromCoordinate([inner[2], inner[3]]);
        break;
      case 'pixel':
        lowerLeftInner = [inner[0], inner[1]];
        upperRightInner = [inner[2], inner[3]];
        break
    }
    var y_min = lowerLeftInner[1] * ol.has.DEVICE_PIXEL_RATIO;
    var x_min = lowerLeftInner[0] * ol.has.DEVICE_PIXEL_RATIO;
    var y_max = upperRightInner[1] * ol.has.DEVICE_PIXEL_RATIO;
    var x_max = upperRightInner[0] * ol.has.DEVICE_PIXEL_RATIO;
    this._drawShadow.inner[0] = x_min;
    this._drawShadow.inner[1] = y_min;
    this._drawShadow.inner[2] = x_max;
    this._drawShadow.inner[3] = y_max;
  }
  if (_.isNil(scale)) {
    this._drawShadow.scale = this._drawShadow.scale || 1;
  } else {
    this._drawShadow.scale = scale;
  }
  if (_.isNil(rotation)) {
    this._drawShadow.rotation = this._drawShadow.rotation || 0;
  } else {
    this._drawShadow.rotation = rotation;
  }
  if (this._drawShadow.outer) {
    map.render();
  }
};

// funzione grigio mappa precompose mapcompose
proto.startDrawGreyCover = function() {
  var self = this;
    // after rendering the layer, restore the canvas context
  var map = this.viewer.map;
  var x_min, x_max, y_min, y_max, rotation, scale;
  //verifico che non ci sia già un greyListener
  if (this._greyListenerKey) {
      this.stopDrawGreyCover();
  }

  function postcompose(evt) {
    var ctx = evt.context;
    var size = this.getSize();
    // Inner polygon,must be counter-clockwise
    var height = size[1] * ol.has.DEVICE_PIXEL_RATIO;
    var width = size[0] * ol.has.DEVICE_PIXEL_RATIO;
    self._drawShadow.outer = [0,0,width, height];
    ctx.restore();
    ctx.beginPath();
    // Outside polygon, must be clockwise
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.lineTo(0, 0);
    ctx.closePath();
    // fine bbox esterno (tutta la mappa-)
    if (self._drawShadow.inner.length) {
      ctx.save();
      x_min = self._drawShadow.inner[0];
      y_min = self._drawShadow.inner[3];
      x_max = self._drawShadow.inner[2];
      y_max = self._drawShadow.inner[1];
      rotation = self._drawShadow.rotation;
      scale = self._drawShadow.scale;
      // Inner polygon,must be counter-clockwise antiorario
      ctx.translate((x_max+x_min)/2, (y_max+y_min)/2);
      ctx.rotate(rotation*Math.PI / 180);
      ctx.moveTo(-((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.lineTo(((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.lineTo(((x_max-x_min)/2),-((y_max-y_min)/2));
      ctx.lineTo(-((x_max-x_min)/2),-((y_max-y_min)/2));
      ctx.lineTo(-((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.closePath();
      // fine bbox interno
    }
    ctx.fillStyle = 'rgba(0, 5, 25, 0.40)';
    ctx.fill();
    ctx.restore();
  }
  this._greyListenerKey = map.on('postcompose', postcompose);
};

proto.stopDrawGreyCover = function() {
  var map = this.viewer.map;
  ol.Observable.unByKey(this._greyListenerKey);
  this._greyListenerKey = null;
  if (this._drawShadow.inner.length) {
    this._resetDrawShadowInner();
  }
  map.render();
};

// funzione che rimuove layer aggiunti esterni
proto.removeExternalLayer = function(name) {
  var layer = this.getLayerByName(name);
  var catalogService = GUI.getComponent('catalog').getService();
  var QueryResultService = GUI.getComponent('queryresults').getService();
  QueryResultService.unregisterVectorLayer(layer);
  this.viewer.map.removeLayer(layer);
  catalogService.removeExternalLayer(name);
};

// funzione che aggiunge layer esterni
proto.addExternalLayer = function(externalLayer) {

  //funzione che mippermette di fare il loadind del layer sulla mappa
  function loadExternalLayer(format, data) {
    features = format.readFeatures(data, {
      dataProjection: 'EPSG:'+ crs,
      featureProjection: self.getEpsg()
    });
    vectorSource = new ol.source.Vector({
      features: features
    });
    vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      //style: styleFunction,
      name: name
    });
    //vado a settare il colore al vector layer
    vectorLayer.setStyle(self.setExternalLayerColor(color));
    extent = vectorLayer.getSource().getExtent();
    //setto il bbox perchè mi servirà nel catalog
    externalLayer.bbox = {
      minx: extent[0],
      miny: extent[1],
      maxx: extent[2],
      maxy: extent[3]
    };
    map.addLayer(vectorLayer);
    //vado a registrae il layer vettoriale per la query
    QueryResultService.registerVectorLayer(vectorLayer);
    //vado ad aggiungere il layer esterno
    catalogService.addExternalLayer(externalLayer);
    map.getView().fit(vectorSource.getExtent());
  }

  var self = this;
  var format,
    features,
    vectorSource,
    vectorLayer,
    extent;
  var map = this.viewer.map;
  var name = externalLayer.name;
  var color = externalLayer.color;
  var type = externalLayer.type;
  var crs = externalLayer.crs;
  var data = externalLayer.data;
  var catalogService = GUI.getComponent('catalog').getService();
  var QueryResultService = GUI.getComponent('queryresults').getService();
  // cerco di verificare se esiste già un layer nella mappa
  var layer = this.getLayerByName(name);
  // aggiungo solo nel caso di layer non presente
  if (!layer) {
    // nel caso in cui i sistemi di riferimento del layer e della mappa sono diversi
    // vado a definirne il sistema (caso a sistemi di proiezione non standard in OL3 diversi da 3857 e 4326)
    if (crs != self.getCrs()) {
      self.defineProjection(crs);
    }
    //verifico il tipo di file uplodato
    switch (type) {
      case 'geojson':
        format = new ol.format.GeoJSON();
        loadExternalLayer(format, data);
        break;
      case 'kml':
        format = new ol.format.KML({
          extractStyles: false
        });
        loadExternalLayer(format, data);
        break;
      case 'zip':
        // qui non specifico l'epsg in quanto lo legge da solo
        // dal file prj
        var geoJSONFile;
        loadshp({
          url: data,
          encoding: 'big5',
          EPSG: crs
        }, function(geojson) {
          if (!geoJSONFile) {
            geoJSONFile = geojson;
            crs = '4326';
            data = JSON.stringify(geojson);
            format = new ol.format.GeoJSON();
            loadExternalLayer(format, data);
          }
        });
        break;
    }
  } else {
    GUI.notify.info('Layer già aggiunto');
  }
};

// setta il colore al layer caricati esternamente
proto.setExternalLayerColor = function(color) {
  // stile
  var color = color.rgba;
  color = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ','  + color.a + ')';
  var defaultStyle = {
    'Point': new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: color
        }),
        radius: 5,
        stroke: new ol.style.Stroke({
          color: color,
          width: 1
        })
      })
    }),
    'LineString': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    }),
    'Polygon': new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255,255,255,0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    }),
    'MultiPoint': new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: color
        }),
        radius: 5,
        stroke: new ol.style.Stroke({
          color: color,
          width: 1
        })
      })
    }),
    'MultiLineString': new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    }),
    'MultiPolygon': new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255,255,255,0.5)'
      }),
      stroke: new ol.style.Stroke({
        color: color,
        width: 3
      })
    })
  };
  var styleFunction = function(feature, resolution) {
    var featureStyleFunction = feature.getStyleFunction();
    if (featureStyleFunction) {
      return featureStyleFunction.call(feature, resolution);
    } else {
      return defaultStyle[feature.getGeometry().getType()];
    }
  };

  return styleFunction
};

module.exports = MapService;
