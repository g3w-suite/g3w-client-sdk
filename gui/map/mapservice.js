const inherit = require('core/utils/utils').inherit;
const t = require('core/i18n/i18n.service').t;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const GUI = require('gui/gui');
const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const MapLayersStoreRegistry = require('core/map/maplayersstoresregistry');
const Filter = require('core/layers/filter/filter');
const WFSProvider = require('core/layers/providers/wfsprovider');
const ol3helpers = require('g3w-ol3/src/g3w.ol3').helpers;
const WMSLayer = require('core/layers/map/wmslayer');
const XYZLayer = require('core/layers/map/xyzlayer');
const ControlsFactory = require('gui/map/control/factory');
const StreetViewService = require('gui/streetview/streetviewservice');
const ControlsRegistry = require('gui/map/control/registry');

function MapService(options) {
  let self = this;
  this.viewer = null;
  this.target = null;
  this._layersStoresEventKeys = {};
  this.project   = null;
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
    ProjectsRegistry.onafter('setCurrentProject',(project) => {
      this._removeListeners();
      this.project = project;
      this._setupLayers();
      this._resetView();
    })
  }
  this._setupListeners();
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
      if (this.viewer) {
        this.viewer.destroy();
        this.viewer = null;
      }
      this._setupViewer(width, height);
      this.state.bbox = this.viewer.getBBOX();
      this.state.resolution = this.viewer.getResolution();
      this.state.center = this.viewer.getCenter();
      this.setupControls();
      this._setupLayers();
      this.emit('viewerset');
    },
    controlClick: function() {}
  };

  this.on('cataloglayerselected', (layer) => {
    // aggiunto condizione querable
   if (layer && layer.isQueryable()) {
     _.forEach(this._mapControls, function(mapcontrol) {
       if (_.indexOf(_.keysIn(mapcontrol.control), 'onSelectLayer') > -1 && mapcontrol.control.onSelectLayer()) {
         if (mapcontrol.control.getGeometryTypes().indexOf(layer.getGeometryType()) > -1 ) {
           mapcontrol.control.setEnable(true);
         } else {
           mapcontrol.control.setEnable(false);
         }
       }
     })
   }
  });

  this.on('cataloglayerunselected', (layer) => {
    _.forEach(this._mapControls, function(mapcontrol) {
      if (_.indexOf(_.keysIn(mapcontrol.control),'onSelectLayer') > -1 && mapcontrol.control.onSelectLayer()) {
        mapcontrol.control.setEnable(false);
      }
    })
  });

  // vado a registrare gli eventi sui layerstores esistesenti nel registro al momento
  // dell'istanziamaneto del mapService
  MapLayersStoreRegistry.getLayersStores().forEach((layerStore) => {
    this._setUpEventsKeysToLayersStore(layerStore);
  });

  // sto in ascolto di evantuali aggiunte di layersStore per poter eventualmente
  // aggiungere i suoi layers alla mappa
  MapLayersStoreRegistry.onafter('addLayersStore', (layerStore) => {
    this._setUpEventsKeysToLayersStore(layerStore);
  });
  // sto in ascolto di evantuali aggiunte di layersStore per poter eventualmente
  // aggiungere i suoi layers alla mappa
  MapLayersStoreRegistry.onafter('removeLayersStore', (layerStore) => {
    this._removeEventsKeysToLayersStore(layerStore);
  });
  base(this);
}


inherit(MapService, G3WObject);

const proto = MapService.prototype;

proto.createOlLayer = function(options) {
  options = options || {};
  var id = options.id;
  var geometryType = options.geometryType;
  var color = options.color;
  var style;
  // vado a creare il layer ol per poter essere aggiunto alla mappa
  var olSource = new ol.source.Vector({
    features: new ol.Collection()
  });
  var olLayer = new ol.layer.Vector({
    id: id,
    source: olSource
  });
  switch (geometryType) {
    case 'Point' || 'MultiPoint':
      style = new ol.style.Style({
                image: new ol.style.Circle({
                  radius: 5,
                  fill: new ol.style.Fill({
                    color: color
                  })
                })
              });
      break;
    case 'Line' || 'MultiLine':
      style = new ol.style.Style({
            stroke: new ol.style.Stroke({
              width: 3,
              color: color
            })
          });
      break;
    case 'Polygon' || 'MultiPolygon':
      style =  new ol.style.Style({
            stroke: new ol.style.Stroke({
              color:  color,
              width: 3
            }),
            fill: new ol.style.Fill({
              color: color
            })
          });
      olLayer.setOpacity(0.6);
  }
  olLayer.setStyle(style);
  return olLayer;
};

// rende questo mapservice slave di un altro MapService
proto.slaveOf = function(mapService, sameLayers) {
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
  return this.project.getProjection();
};

proto.getCrs = function() {
  return this.getProjection().getCode();
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
  const mapLayer = this.getMapLayerForLayer(layer);
  return mapLayer.getGetFeatureInfoUrl(coordinates,resolution,epsg,params);
};

proto.showMarker = function(coordinates, duration) {
  duration = duration || 1000;
  this._marker.setPosition(coordinates);
  setTimeout(() => {
    this._marker.setPosition();
  }, duration)
};

// ritorna il layer nella mappa in base al name
proto.getLayerByName = function(name) {
  const map = this.viewer.map;
  let layer = null;
  map.getLayers().forEach((lyr) => {
    if (lyr.get('name') == name) {
      layer = lyr;
      return false
    }
  });
  return layer;
};

// ritorna il layer della mappa in base all'id
proto.getLayerById = function(id) {
  let layer;
  const map = this.viewer.map;
  map.getLayers().forEach(function(lyr) {
    if (lyr.get('id') == id) {
      layer = lyr;
      return false
    }
  });
  return layer;
};

proto.getQueryLayersPromisesByCoordinates = function(layerFilterObject, coordinates) {
  const layers = this.getLayers(layerFilterObject);
  let queryPromises = [];// raccoglie tutte le promises dei provider del layer
  // ciclo sui layer e per ogni layer chiamo il metodo query
  // passando alcune opzioni)
  layers.forEach((layer) => {
    queryPromises.push(layer.query({
      coordinates: coordinates,
      resolution: this.getResolution()
    }))
  });
  return queryPromises;
};

proto.getQueryLayersPromisesByFilter = function(layerFilterObject, filter) {
  const layers = this.getLayers(layerFilterObject);
  let queryPromises = [];// raccoglie tutte le promises dei provider del layer
  // ciclo sui layer e per ogni layer chiamo il metodo query
  // passando alcune opzioni)
  layers.forEach((layer) => {
    queryPromises.push(layer.query({
      filter: filter
    }))
  });
  return queryPromises;
};

proto.setupControls = function(){
  if (this.config && this.config.mapcontrols) {
    const mapcontrols = this.config.mapcontrols;
    mapcontrols.forEach((controlType) => {
      let control;
      switch (controlType) {
        case 'reset':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
          }
          this.addControl(controlType,control);
          break;
        case 'zoom':
          control = ControlsFactory.create({
            type: controlType,
            zoomInLabel: "\ue98a",
            zoomOutLabel: "\ue98b"
          });
          this.addControl(controlType,control);
          break;
        case 'zoombox':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('zoomend', (e) => {
              this.viewer.fit(e.extent);
            });
            this.addControl(controlType,control);
          }
          break;
        case 'zoomtoextent':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType,
              label: "\ue98c",
              extent: this.project.state.initextent
            });
            this.addControl(controlType,control);
          }
          break;
        case 'query':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('picked', (e) => {
            const coordinates = e.coordinates;
            this.getMap().getView().setCenter(coordinates);
            // visualizzo il marker per far vederee il punto dove ho cliccato
            this.showMarker(coordinates);
            const showQueryResults = GUI.showContentFactory('query');
            // recupero i layers che hanno le caratteristiche di esserere interrogabili
            const layersFilterObject = {
              QUERYABLE: true,
              SELECTEDORALL: true,
              VISIBLE: true
            };
            let queryPromises = this.getQueryLayersPromisesByCoordinates(layersFilterObject, coordinates);// raccoglie tutte le promises dei provider del layer
            //faccio query by location su i layers selezionati o tutti
            const queryResultsPanel = showQueryResults('');
            $.when.apply(this, queryPromises)
              .then((...args) => {
                layersResults = args;
                const results = {
                  query: layersResults[0] ? layersResults[0].query: null,
                  data: []
                };
                layersResults.forEach((result) => {
                  result.data ? results.data.push(result.data[0]): null;
                });
                queryResultsPanel.setQueryResponse(results, coordinates, this.state.resolution);
                })
              .fail(function() {
                GUI.notify.error(t("info.server_error"));
                GUI.closeContent();
              })
          });
          this.addControl(controlType,control);
          //set active control by default
          control.toggle();
          break;
        case 'querybypolygon':
          const controlLayers = this.getLayers({
            QUERYABLE: true,
            SELECTEDORALL: true,
            VISIBLE: true
          });
          control = ControlsFactory.create({
            type: controlType,
            layers: controlLayers
          });
          if (control) {
            const showQueryResults = GUI.showContentFactory('query');
            control.on('picked', (e) => {
              let results = {};
              let geometry;
              const coordinates = e.coordinates;
              this.getMap().getView().setCenter(coordinates);
              let layersFilterObject = {
                QUERYABLE: true,
                SELECTED: true,
                VISIBLE: true
              };
              let queryPromises = this.getQueryLayersPromisesByCoordinates(layersFilterObject, coordinates);
              $.when.apply(this, queryPromises)
                .then((...args) => {
                  let layersResults = args;
                  let queryPromises = [];
                  results = {};
                  // vado ad unificare i rusltati delle promises
                  results.query = layersResults[0] ? layersResults[0].query: null;
                  if (layersResults[0] && layersResults[0].data && layersResults[0].data.length) {
                    geometry = layersResults[0].data[0].features[0].getGeometry();
                    if (geometry) {
                      let filter = new Filter();
                      filter.setGeometry(geometry);
                      let layersFilterObject = {
                        ALLNOTSELECTED: true,
                        FILTERABLE: true,
                        VISIBLE: true
                      };
                      queryPromises = this.getQueryLayersPromisesByFilter(layersFilterObject, filter);
                      this.highlightGeometry(geometry);
                    }
                    const queryResultsPanel = showQueryResults('');
                    $.when.apply(this, queryPromises)
                      .then((...args) => {
                        layersResults = args;
                        const results = {
                          query: layersResults[0] ? layersResults[0].query: null,
                          data: []
                        };
                        _.forEach(layersResults, function(result) {
                          result.data ? results.data.push(result.data[0]): null;
                        });
                        queryResultsPanel.setQueryResponse(results, geometry, this.state.resolution);
                      })
                      .fail(() => {
                        GUI.notify.error(t("info.server_error"));
                        GUI.closeContent();
                      })
                      .always(() => {
                        this.clearHighlightGeometry();
                      });
                  }
                })
                .fail(() => {
                  GUI.notify.error(t("info.server_error"));
                  GUI.closeContent();
                })
            });
            this.addControl(controlType, control);
          }
          break;
        case 'querybbox':
          if (!isMobile.any && this.filterableLayersAvailable()) {
            const controlLayers = this.getLayers({
              SELECTEDORALL: true,
              FILTERABLE: true,
              VISIBLE: true
            });
            control = ControlsFactory.create({
              type: controlType,
              layers: controlLayers
            });
            if (control) {
              control.on('bboxend', (e) => {
                const bbox = e.extent;
                const center = ol.extent.getCenter(bbox);
                this.getMap().getView().setCenter(center);
                const layers = this.getLayers({
                  SELECTEDORALL: true,
                  FILTERABLE: true,
                  VISIBLE: true
                });
                let queryPromises = [];// raccoglie tutte le promises dei provider del layer
                layers.forEach((layer) => {
                  const filter = new Filter();
                  filter.setBBOX(bbox);
                  queryPromises.push(layer.query({
                    filter: filter
                  }))
                });
                const showQueryResults = GUI.showContentFactory('query');
                const queryResultsPanel = showQueryResults('');
                $.when.apply(this, queryPromises)
                  .then((...args) => {
                    layersResults = args;
                    const results = {
                      query: layersResults[0] ? layersResults[0].query: null,
                      data: []
                    };
                    _.forEach(layersResults, function(result) {
                      result.data ? results.data.push(result.data[0]): null;
                    });
                    queryResultsPanel.setQueryResponse(results, bbox, this.state.resolution);
                  })
                  .fail((error) => {
                    let msg = t("info.server_error");
                    if (error) {
                      msg += ' '+error;
                    }
                    GUI.notify.error(msg);
                    GUI.closeContent();
                  })
                });
              this.addControl(controlType, control);
            }
          }
          break;
        case 'streetview':
          // streetview
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.setProjection(this.getProjection());
            this.addControl(controlType, control);
            this.on('viewerset', () => {
              this.viewer.map.addLayer(control.getLayer());
            });
            $script("https://maps.googleapis.com/maps/api/js?key=AIzaSyBCHtKGx3yXWZZ7_gwtJKG8a_6hArEFefs",
              function() {
                let position = {
                  lat: null,
                  lng: null
                };
                const streetViewService = new StreetViewService();
                streetViewService.onafter('postRender', (position) => {
                  control.setPosition(position);
                });
                if (control) {
                  control.on('picked', (e) => {
                    const coordinates = e.coordinates;
                    const lonlat = ol.proj.transform(coordinates, this.getProjection().getCode(), 'EPSG:4326');
                    position.lat = lonlat[1];
                    position.lng = lonlat[0];
                    streetViewService.showStreetView(position);
                  });
                  control.on('disabled', () => {
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
          this.addControl(controlType,control);
          break;
        case 'overview':
          if (!isMobile.any) {
            if (!this.config.overviewproject) {
              return
            }
            const overviewProjectGid = this.config.overviewproject.gid;
            if (overviewProjectGid) {
              ProjectsRegistry.getProject(overviewProjectGid)
              .then((project) =>{
                const overViewMapLayers = this.getOverviewMapLayers(project);
                control = ControlsFactory.create({
                  type: controlType,
                  position: 'bl',
                  className: 'ol-overviewmap ol-custom-overviewmap',
                  collapseLabel: $('<span class="glyphicon glyphicon-menu-left"></span>')[0],
                  label: $('<span class="glyphicon glyphicon-menu-right"></span>')[0],
                  collapsed: false,
                  layers: overViewMapLayers,
                  view: new ol.View({
                    projection: this.getProjection()
                  })
                });
                this.addControl(controlType,control);
              });
            }
          }
          break;
        case 'nominatim':
          control = ControlsFactory.create({
            type: controlType,
            bbox: this.project.state.initextent,
            mapCrs: 'EPSG:'+this.project.state.crs
          });
          control.on('addresschosen', (evt) => {
            const coordinate = evt.coordinate;
            const geometry =  new ol.geom.Point(coordinate);
            this.highlightGeometry(geometry);
          });
          this.addControl(controlType,control);
          $('#search_nominatim').click(() => {
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
            control.on('click',(evt) => {
              this.showMarker(evt.coordinates);
            });
            control.on('error', (e) => {
              GUI.notify.error(t("mapcontrols.geolocation.error"))
            });
            this.addControl(controlType, control);
          }
          break;
        case 'addlayers':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('addlayer', () => {
              this.emit('addexternallayer');
            });
            this.addControl(controlType, control);
          }
          break;
        case 'length':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            this.addControl(controlType, control);
          }
          break;
        case 'area':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            this.addControl(controlType, control);
          }
          break;
      }
    });
  }
};

// funzione che recupera i layers dagli stores
proto.getLayers = function(filter) {
  filter = filter || {};
  const mapFilter = {
    GEOLAYER: true
  };
  filter = _.merge(filter, mapFilter);
  let layers = [];
  _.forEach(MapLayersStoreRegistry.getQuerableLayersStores(), function(layerStore) {
    _.merge(layers, layerStore.getLayers(filter));
  });
  return layers;
};

// verifica se esistono layer filtrabili
proto.filterableLayersAvailable = function() {
  const layers = this.getLayers({
    QUERYABLE: true,
    FILTERABLE: true,
    SELECTEDORALL: true
  });
  return layers.some((layer) => {
    // nel caso il provider dei filtri sia WFS verifico che sia lo stesso sistema di riferimento del progetto, perché QGIS ancora non supporta riproiezione su WFS
    if (layer.getProvider('filter') instanceof WFSProvider) {
      return layer.getProjection().getCode() == this.project.getLayersStore().getProjection().getCode();
    }
    return true;
  });
};

proto.addControl = function(type, control) {
  this.viewer.map.addControl(control);
  this._mapControls.push({
    type: type,
    control: control,
    visible: true
  });
  control.on('controlclick', () => {
    this.controlClick();
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
  this._removeControls();
  this._mapControls.forEach((controlObj) => {
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
  this._mapControls.forEach((controlObj) => {
    if (controlObj.visible) {
      this.viewer.map.addControl(controlObj.control);
    }
  })
};

proto.getMapControls = function() {
  return this._mapControls;
};

proto.removeControl = function(type) {
  this._mapControls.forEach((controlObj, ctrlIdx) => {
    if (type == controlObj.type) {
      this._mapControls.splice(ctrlIdx,1);
      this.viewer.map.removeControl(controlObj.control);
      return false;
    }
  })
};

proto._removeControls = function() {
  this._mapControls.forEach((controlObj) => {
    this.viewer.map.removeControl(controlObj.control);
  })
};

proto._unToggleControls = function() {
  this._mapControls.forEach((controlObj) => {
    // verifico che sia un controllo con la funzione is Toggled e se questo è stata settata a true
    if (controlObj.control.isToggled && controlObj.control.isToggled()) {
      controlObj.control.toggle(false);
      GUI.closeContent();
    }
  });

};

//aggiungo il map layers all lista maplayers
proto.addMapLayer = function(mapLayer) {
  this._mapLayers.push(mapLayer);
};

proto.getMapLayers = function() {
  return this._mapLayers;
};

proto.getMapLayerForLayer = function(layer) {
  let mapLayer;
  const multilayerId = 'layer_'+layer.getMultiLayerId();
  _.forEach(this.getMapLayers(), function(_mapLayer) {
    if (_mapLayer.getId() == multilayerId) {
      mapLayer = _mapLayer;
      return false;
    }
  });
  return mapLayer;
};

proto.getProjectLayer = function(layerId) {
  let layer = null;
  MapLayersStoreRegistry.getLayersStores().forEach((layerStore) => {
    layer = layerStore.getLayerById(layerId);
    if (layer)
      return false
  });
  return layer;
};

proto._resetView = function() {
  const width = this.viewer.map.getSize()[0];
  const height = this.viewer.map.getSize()[1];
  const extent = this.project.state.extent;
  const maxxRes = ol.extent.getWidth(extent) / width;
  const minyRes = ol.extent.getHeight(extent) / height;
  const maxResolution = Math.max(maxxRes,minyRes) > this.viewer.map.getView().getMaxResolution() ? Math.max(maxxRes,minyRes): this.viewer.map.getView().getMaxResolution();
  const view = new ol.View({
    extent: extent,
    projection: this.viewer.map.getView().getProjection(),
    center: this.viewer.map.getView().getCenter(),
    resolution: this.viewer.map.getView().getResolution(),
    maxResolution: maxResolution
  });
  this.viewer.map.setView(view);
};

// funzione che setta la view basata sulle informazioni del progetto
proto._setupViewer = function(width,height) {
  const projection = this.getProjection();
  // ricavo l'estensione iniziale del progetto)
  const initextent = this.project.state.initextent;
  // ricavo l'estensione del progetto
  const extent = this.project.state.extent;

  const maxxRes = ol.extent.getWidth(extent) / width;
  const minyRes = ol.extent.getHeight(extent) / height;
  // calcolo la massima risoluzione
  const maxResolution = Math.max(maxxRes,minyRes);

  const initxRes = ol.extent.getWidth(initextent) / width;
  const inityRes = ol.extent.getHeight(initextent) / height;
  const initResolution = Math.max(initxRes,inityRes);

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

  $(this.viewer.map.getViewport()).prepend('<div id="map-spinner" style="position:absolute;right:0;"></div>');

  this.viewer.map.getInteractions().forEach((interaction) => {
    this._watchInteraction(interaction);
  });

  this.viewer.map.getInteractions().on('add', (interaction) => {
    this._watchInteraction(interaction.element);
  });

  this.viewer.map.getInteractions().on('remove',(interaction) => {
    //this._onRemoveInteraction(interaction);
  });

  this.viewer.map.getView().setResolution(initResolution);

  this.viewer.map.on('moveend',(e) =>{
    this._setMapView();
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

proto._removeListeners = function() {

  if (this._setBaseLayerListenerKey) {
    this.project.un('setBaseLayer',this._setBaseLayerListenerKey);
  }
};

// vado a registrare tuti gli ebventi del layersStore
proto._removeEventsKeysToLayersStore = function(layerStore) {
  const layerStoreId = layerStore.getId();
  if (this._layersStoresEventKeys[layerStoreId]) {
    this._layersStoresEventKeys[layerStoreId].forEach((eventObj) => {
      _.forEach(eventObj, function(eventKey, event) {
        layerStore.un(event, eventKey);
      })
    })
  }
};

// vado a registrare tuti gli eventi del layersStore
proto._setUpEventsKeysToLayersStore = function(layerStore) {
  const layerStoreId = layerStore.getId();
  if (!this._layersStoresEventKeys[layerStoreId]) {
    this._layersStoresEventKeys[layerStoreId] = [];
    //evento cambio visibilità al layer
    const layerVisibleKey = layerStore.onafter('setLayersVisible',  (layersIds) => {
      const mapLayers = layersIds.map((layerId) => {
        const layer = layerStore.getLayerById(layerId);
        return this.getMapLayerForLayer(layer);
      });
      this.updateMapLayers(mapLayers);
    });
    this._layersStoresEventKeys[layerStore.getId()].push({
      setLayersVisible:layerVisibleKey
    });

    //evento aggiunta Layer al layerStore
    const addLayerKey = layerStore.onafter('addLayer', (layer) => {
      if (layer.getType() == 'vector') {
        //creo il layer OL
        const olLayer = this.createOlLayer({
          id: layer.getId(),
          geometryType: layer.getGeometryType(),
          color: layer.getColor()
        });
        // lo aggiungo alla mappa
        this.viewer.map.addLayer(olLayer);
      }
    });

    this._layersStoresEventKeys[layerStore.getId()].push({
      addLayer: addLayerKey
    });

    //evento aggiunta Layer al layerStore
    const removeLayerKey = layerStore.onafter('removeLayer',  (layer) => {
      if (layer.getType() == 'vector') {
        const layerId = layer.getId();
        const olLayer = this.getLayerById(layerId);
        // lo aggiungo alla mappa
        this.viewer.map.removeLayer(olLayer);
      }
    });

    this._layersStoresEventKeys[layerStore.getId()].push({
      removeLayer: removeLayerKey
    });
  }
};

proto._setupListeners = function() {
  this._setBaseLayerListenerKey = this.project.onafter('setBaseLayer',() => {
    this.updateMapLayers(this.mapBaseLayers);
  });
};

proto._setupBaseLayers = function(){
  let baseLayer;
  const baseLayers = this.getLayers({
    BASELAYER: true
  });
  if (!baseLayers.length){
    return;
  }
  this.mapBaseLayers = {};
  baseLayers.forEach((layer) => {
    //verifico se è un layer wms
    if (layer.isWMS()) {
      const config = {
        url: layer.getWmsUrl(),
        id: layer.state.id,
        tiled: layer.state.tiled
      };
      baseLayer = new WMSLayer(config);
      baseLayer.addLayer(layer);
    } else {
      baseLayer = layer;
      baseLayer.setLayer(layer);
    }
    this.registerListeners(baseLayer);
    this.mapBaseLayers[layer.getId()] = baseLayer;
  });
  const reverseBaseLayers = Object.values(this.mapBaseLayers).reverse();
  reverseBaseLayers.forEach((baseLayer) => {
    this.viewer.map.addLayer(baseLayer.getOLLayer());
    baseLayer.update(this.state);
  });
};

proto._setupLayers = function(){
  //vado a rimuvere tutti i layers della mappa
  this.viewer.removeLayers();
  // resetto i mapLayers
  this._resetMapLayers();
  // vao da fare il setup dei base layesr
  this._setupBaseLayers();
  // recupero i layers dai vari layerstore mettendo coem condizione escludendo i base layer fatti sopra
  const layers = this.getLayers({
    BASELAYER:false
  });
  //raggruppo per valore del multilayer con chiave valore multilayer
  // e valore array
  const multiLayers = _.groupBy(layers, function(layer){
    return layer.getMultiLayerId();
  });
  //una volta raggruppati per multilayer dove la chiave è il valore del multilayer
  // e il valore è un array di uno o più Layers, distinguo tra layers singoli o multipli e tra layer cachati o non
  Object.entries(multiLayers).forEach(([id, layers]) => {
    const multilayerId = 'layer_'+id;
    let mapLayer;
    const layer = layers[0];
    if (layers.length == 1 && layer.isCached()) {
      mapLayer = new XYZLayer({
        id: multilayerId,
        projection: this.getProjection()
      });
      this.addMapLayer(mapLayer);
      this.registerListeners(mapLayer);
      mapLayer.addLayer(layer);
    }
    // in casi di multilayers
    else {
      // creo configurazione per costruire il layer wms
      //creo il wms layer
      mapLayer = new WMSLayer({
        // getWMSUrl funzione creata in fase di inizializzazione dell'applicazione
        url: layer.getWmsUrl(),
        id: multilayerId
      }, this.layersExtraParams);
      this.addMapLayer(mapLayer);
      this.registerListeners(mapLayer);
      // lo aggiungo alla lista dei mapLayers
      layers.reverse().forEach((sub_layer) => {
        // per ogni layer appartenete allo stesso multilayer (è un array)
        // viene aggiunto al mapLayer (WMSLayer) perecedentemente creato
        mapLayer.addLayer(sub_layer);
      });
    }
  });

  // una volta creati tutti i mapLayer apparteneti alla mappa
  this.getMapLayers().reverse().forEach((mapLayer) => {
    // scorro sui mapLayer (reverse) e aggiungo alla mappa
    this.viewer.map.addLayer(mapLayer.getOLLayer());
    mapLayer.update(this.state, this.layersExtraParams);
  });
  return this.mapLayers;
};

proto.getOverviewMapLayers = function(project) {
  const projectLayers = project.getLayersStore().getLayers({
    VISIBLE: true,
    GEOLAYER: true,
    HIDDEN: false
  });

  const multiLayers = _.groupBy(projectLayers,function(layer){
    return layer.getMultiLayerId();
  });

  let overviewMapLayers = [];
  Object.entries(multiLayers).forEach(([id, layers]) => {
    const multilayerId = 'overview_layer_'+id;
    const tiled = layers[0].state.tiled;
    const config = {
      url: project.getWmsUrl(),
      id: multilayerId,
      tiled: tiled
    };
    const mapLayer = new WMSLayer(config);
    layers.reverse().forEach((layer) => {
      mapLayer.addLayer(layer);
    });
    overviewMapLayers.push(mapLayer.getOLLayer(true));
  });

  return overviewMapLayers.reverse();
};

proto.updateMapLayers = function(mapLayers) {
  Object.entries(mapLayers).forEach(([key,mapLayer]) => {
    mapLayer.update(this.state, this.layersExtraParams);
  })
};
// funzione che registra i listeners sulla creazione del mapLayers
proto.registerListeners = function(mapLayer) {

  mapLayer.on('loadstart', () => {
    this._incrementLoaders();
  });
  mapLayer.on('loadend', () => {
    this._decrementLoaders(false);
  });

  this.on('extraParamsSet',(extraParams, update) => {
    if (update) {
      mapLayer.update(this.state,extraParams);
    }
  })
};

proto.setTarget = function(elId){
  this.target = elId;
};

// al momento dell'aggiunta di una iterazione
proto.addInteraction = function(interaction) {
  //vado a fare l'untoggle di tutti i control della mappa
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
  interaction.on('change:active',(e) => {
    if ((e.target instanceof ol.interaction.Pointer) && e.target.getActive()) {
      this.emit('mapcontrol:active', e.target);
    }
  })
};

proto.zoomTo = function(coordinate, zoom) {
  zoom = _.isNumber(zoom) ? zoom : 6;
  this.viewer.zoomTo(coordinate, zoom);
};

proto.goTo = function(coordinates,zoom) {
  const options = {
    zoom: zoom || 6
  };
  this.viewer.goTo(coordinates, options);
};

proto.goToRes = function(coordinates, resolution){
  const options = {
    resolution: resolution
  };
  this.viewer.goToRes(coordinates,options);
};

proto.goToBBox = function(bbox) {
  this.viewer.fit(bbox);
};


proto.goToWGS84 = function(coordinates,zoom){
  coordinates = ol.proj.transform(coordinates,'EPSG:4326','EPSG:'+this.project.state.crs);
  this.goTo(coordinates,zoom);
};

proto.extentToWGS84 = function(extent){
  return ol.proj.transformExtent(extent,'EPSG:'+this.project.state.crs,'EPSG:4326');
};

proto.getResolutionForMeters = function(meters) {
  const viewport = this.viewer.map.getViewport();
  return meters / Math.max(viewport.clientWidth,viewport.clientHeight);
};

let highlightLayer = null;
let animatingHighlight = false;

proto.highlightGeometry = function(geometryObj,options) {
  this.clearHighlightGeometry();
  options = options || {};
  let zoom = (typeof options.zoom == 'boolean') ? options.zoom : true;
  const highlight = (typeof options.highlight == 'boolean') ? options.highlight : true;
  const duration = options.duration || 2000;
  let geometry;
  if (geometryObj instanceof ol.geom.Geometry){
    geometry = geometryObj;
  }
  else {
    let format = new ol.format.GeoJSON;
    geometry = format.readGeometry(geometryObj);
  }

  if (options.fromWGS84) {
    geometry.transform('EPSG:4326','EPSG:'+ProjectService.state.project.crs);
  }

  const geometryType = geometry.getType();
  if (zoom) {
    if (geometryType == 'Point' || (geometryType == 'MultiPoint' && geometry.getPoints().length == 1)) {
      const coordinates = geometryType == 'Point' ? geometry.getCoordinates() : geometry.getPoint(0).getCoordinates();
      if (this.project.state.crs != 4326 && this.project.state.crs != 3857) {
        // zoom ad una risoluzione in cui la mappa copra 100m
        const res = this.getResolutionForMeters(100);
        this.goToRes(coordinates,res);
      }
      else {
        zoom = this.viewer.map.getView().getZoom() > 6 ? self.viewer.map.getView().getZoom() : 6;
        this.goTo(coordinates, zoom);
      }
    }
    else {
      this.viewer.fit(geometry,options);
    }
  }

  if (highlight) {
    const feature = new ol.Feature({
      geometry: geometry
    });

    if (!highlightLayer) {
      highlightLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: function(feature){
          let styles = [];
          const geometryType = feature.getGeometry().getType();
          if (geometryType == 'LineString' || geometryType == 'MultiLineString') {
            const style = new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: 'rgb(255,255,0)',
                width: 4
              })
            });
            styles.push(style);
          }
          else if (geometryType == 'Point' || geometryType == 'MultiPoint') {
            const style = new ol.style.Style({
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
            const style = new ol.style.Style({
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

// funzione che fa il refresh di tutti i layer della mappa
proto.refreshMap = function() {
  _.forEach(this._mapLayers, function(mapLayer) {
    if (!(mapLayer instanceof XYZLayer))
      mapLayer.getOLLayer().getSource().updateParams({"time": Date.now()});
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

proto._resetMapLayers = function() {
  this._mapLayers = [];
};

proto.getMapBBOX = function() {
  return this.viewer.getBBOX();
};

proto._setMapView = function() {
  const bbox = this.viewer.getBBOX();
  const resolution = this.viewer.getResolution();
  const center = this.viewer.getCenter();
  this.setMapView(bbox, resolution, center);
};

proto.getMapSize = function() {
  const map = this.viewer.map;
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
  options = options || {};
  const map = this.viewer.map;
  const type = options.type || 'coordinate'; // di solito sollo coordinate
  const inner = options.inner || null;
  const rotation = options.rotation;
  const scale = options.scale;
  let lowerLeftInner;
  let upperRightInner;
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
    const y_min = lowerLeftInner[1] * ol.has.DEVICE_PIXEL_RATIO;
    const x_min = lowerLeftInner[0] * ol.has.DEVICE_PIXEL_RATIO;
    const y_max = upperRightInner[1] * ol.has.DEVICE_PIXEL_RATIO;
    const x_max = upperRightInner[0] * ol.has.DEVICE_PIXEL_RATIO;
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
  // after rendering the layer, restore the canvas context
  const map = this.viewer.map;
  let x_min, x_max, y_min, y_max, rotation, scale;
  //verifico che non ci sia già un greyListener
  if (this._greyListenerKey) {
      this.stopDrawGreyCover();
  }

  const postcompose = (evt) => {
    const ctx = evt.context;
    const size = this.getMap().getSize();
    // Inner polygon,must be counter-clockwise
    const height = size[1] * ol.has.DEVICE_PIXEL_RATIO;
    const width = size[0] * ol.has.DEVICE_PIXEL_RATIO;
    this._drawShadow.outer = [0,0,width, height];
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
    if (this._drawShadow.inner.length) {
      ctx.save();
      x_min = this._drawShadow.inner[0];
      y_min = this._drawShadow.inner[3];
      x_max = this._drawShadow.inner[2];
      y_max = this._drawShadow.inner[1];
      rotation = this._drawShadow.rotation;
      scale = selthisf._drawShadow.scale;
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
  };

  this._greyListenerKey = map.on('postcompose', postcompose);
};

proto.stopDrawGreyCover = function() {
  const map = this.viewer.map;
  ol.Observable.unByKey(this._greyListenerKey);
  this._greyListenerKey = null;
  if (this._drawShadow.inner.length) {
    this._resetDrawShadowInner();
  }
  map.render();
};

// funzione che rimuove layer aggiunti esterni
proto.removeExternalLayer = function(name) {
  const layer = this.getLayerByName(name);
  const catalogService = GUI.getComponent('catalog').getService();
  const QueryResultService = GUI.getComponent('queryresults').getService();
  QueryResultService.unregisterVectorLayer(layer);
  this.viewer.map.removeLayer(layer);
  catalogService.removeExternalLayer(name);
};

// funzione che aggiunge layer esterni
proto.addExternalLayer = function(externalLayer) {
  let format,
    features,
    vectorSource,
    vectorLayer,
    extent;
  const map = this.viewer.map;
  const name = externalLayer.name;
  const color = externalLayer.color;
  const type = externalLayer.type;
  let crs = externalLayer.crs;
  let data = externalLayer.data;
  const catalogService = GUI.getComponent('catalog').getService();
  const QueryResultService = GUI.getComponent('queryresults').getService();
  // cerco di verificare se esiste già un layer nella mappa
  const layer = this.getLayerByName(name);
  //funzione che mippermette di fare il loadind del layer sulla mappa
  const loadExternalLayer = (format, data) => {
    features = format.readFeatures(data, {
      dataProjection: 'EPSG:'+ crs,
      featureProjection: this.getEpsg()
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
    vectorLayer.setStyle(this.setExternalLayerColor(color));
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
    //var externalVectorLayer = new VectorLayer(externalLayer);
    catalogService.addExternalLayer(externalLayer);
    map.getView().fit(vectorSource.getExtent());
  };

  // aggiungo solo nel caso di layer non presente
  if (!layer) {
    // nel caso in cui i sistemi di riferimento del layer e della mappa sono diversi
    // vado a definirne il sistema (caso a sistemi di proiezione non standard in OL3 diversi da 3857 e 4326)
    if (crs != this.getCrs()) {
      this.defineProjection(crs);
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
        let geoJSONFile;
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
  color = color.rgba;
  color = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ','  + color.a + ')';
  const defaultStyle = {
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
  const styleFunction = function(feature, resolution) {
    const featureStyleFunction = feature.getStyleFunction();
    if (featureStyleFunction) {
      return featureStyleFunction.call(feature, resolution);
    } else {
      return defaultStyle[feature.getGeometry().getType()];
    }
  };

  return styleFunction
};

module.exports = MapService;
