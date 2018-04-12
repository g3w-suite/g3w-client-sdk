const inherit = require('core/utils/utils').inherit;
const t = require('core/i18n/i18n.service').t;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const shpToGeojson = require('core/utils/geo').shpToGeojson;
const GUI = require('gui/gui');
const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const MapLayersStoreRegistry = require('core/map/maplayersstoresregistry');
const Filter = require('core/layers/filter/filter');
const WFSProvider = require('core/layers/providers/wfsprovider');
const ol3helpers = require('g3w-ol3/src/g3w.ol3').helpers;
const ControlsFactory = require('gui/map/control/factory');
const StreetViewService = require('gui/streetview/streetviewservice');
const ControlsRegistry = require('gui/map/control/registry');
const Projections = require('g3w-ol3/src/projection/projections');
const VectorLayer = require('core/layers/vectorlayer');

function MapService(options) {
  this.id = 'MapService';
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
  // function to show spinner layers
  this._incrementLoaders = function() {
    if (this._howManyAreLoading == 0){
      this.emit('loadstart');
      GUI.showSpinner({
        container: $('#map-spinner'),
        id: 'maploadspinner',
        style: 'transparent'
      });
    }
    this._howManyAreLoading += 1;
  };

  this._decrementLoaders = function() {
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
    //on after setting current project
    ProjectsRegistry.onafter('setCurrentProject',(project) => {
      this.removeLayers();
      this._removeListeners();
      this.project = project;
      this._resetView();
      //call a function to setup alla layers of maps
      this._setupLayers()
    })
  }
  this._setupListeners();
  this._marker = null;

  this.setters = {
    updateMapView: function(bbox, resolution, center) {
      this.state.bbox = bbox;
      this.state.resolution = resolution;
      this.state.center = center;
      this.updateMapLayers();
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
    // added querable
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

  this.on('extraParamsSet',(extraParams, update) => {
    if (update) {
      this.getMapLayers().forEach((mapLayer) => {
        mapLayer.update(this.state,extraParams);
      })
    }
  });

  //CHECK IF MAPLAYESRSTOREREGISTRY HAS LAYERSTORE
  MapLayersStoreRegistry.getLayersStores().forEach((layersStore) => {
    this._setUpEventsKeysToLayersStore(layersStore);
  });

  // LISTEN ON EVERY ADDED LAYERSSTORE
  MapLayersStoreRegistry.onafter('addLayersStore', (layersStore) => {
    this._setUpEventsKeysToLayersStore(layersStore);
  });

  // LISTENER ON REMOVE LAYERSTORE
  MapLayersStoreRegistry.onafter('removeLayersStore', (layerStore) => {
    this._removeEventsKeysToLayersStore(layerStore);
  });
  base(this);
}


inherit(MapService, G3WObject);

const proto = MapService.prototype;

proto.slaveOf = function(mapService, sameLayers) {
  sameLayers = sameLayers || false;
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


proto.getProjection = function() {
  return this.project.getProjection();
};

proto.isAxisOrientationInverted = function() {
  return this.getProjection().getAxisOrientation() == 'neu' ? true : false;
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

// return layer by name
proto.getLayerByName = function(name) {
  let layer = null;
  this.getMap().getLayers().getArray().find((lyr) => {
    if (lyr.get('name') == name) {
      layer = lyr;
      return true
    }
  });
  return layer;
};

// return layer by id
proto.getLayerById = function(id) {
  let layer;
  this.getMap().getLayers().getArray().find(function(lyr) {
    if (lyr.get('id') == id) {
      layer = lyr;
      return true
    }
  });
  return layer;
};

// method do get all feature from vector layer based on coordinates
proto.getVectorLayerFeaturesFromCoordinates = function(layerId, coordinates) {
  let intersectGeom;
  let features = [];
  const map = this.getMap();
  const vectorLayer = this.getLayerById(layerId);
  if (Array.isArray(coordinates)) {
    if (coordinates.length == 2) {
      const pixel = map.getPixelFromCoordinate(coordinates);
      map.forEachFeatureAtPixel(pixel, function (feature) {
        features.push(feature);
        },  {
        layerFilter: function(layer) {
          return layer === vectorLayer;
          }
      });
    } else if (coordinates.length == 4) {
      intersectGeom = ol.geom.Polygon.fromExtent(coordinates);
      switch (vectorLayer.constructor) {
        case VectorLayer:
          features = vectorLayer.getIntersectedFeatures(intersectGeom);
          break;
        case ol.layer.Vector:
          _.forEach(vectorLayer.getSource().getFeatures(), function(feature) {
            if (intersectGeom.intersectsExtent(feature.getGeometry().getExtent())) {
              features.push(feature);
              }
          });
          break;
      }
    }
  } else if (coordinates instanceof ol.geom.Polygon || coordinates instanceof ol.geom.MultiPolygon) {
    intersectGeom = coordinates;
    switch (vectorLayer.constructor) {
      case VectorLayer:
        features = vectorLayer.getIntersectedFeatures(intersectGeom);
        break;
      case ol.layer.Vector:
        _.forEach(vectorLayer.getSource().getFeatures(), function(feature) {
          if (intersectGeom.intersectsExtent(feature.getGeometry().getExtent())) {
            features.push(feature);
          }
        });
        break;
    }
  }
  return features;
};

proto.getQueryLayersPromisesByCoordinates = function(layerFilterObject, coordinates) {
  const layers = this.getLayers(layerFilterObject);
  let queryPromises = [];
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
  let queryPromises = [];
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
        case 'mouseposition':
          control = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(4),
            projection: this.getCrs(),
            className: 'custom-ol-mouse-position',
            target: 'mouse-position'
          });
          this.addControl(controlType,control);
          break;
        case 'query':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('picked', (e) => {
            const coordinates = e.coordinates;
            this.getMap().getView().setCenter(coordinates);
            // show marker
            this.showMarker(coordinates);
            const showQueryResults = GUI.showContentFactory('query');
            // get querable layer
            const layersFilterObject = {
              QUERYABLE: true,
              SELECTEDORALL: true,
              VISIBLE: true
            };
            let queryPromises = this.getQueryLayersPromisesByCoordinates(layersFilterObject, coordinates);
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
                  // unify results of the promises
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
                let queryPromises = [];
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
            $script("https://maps.googleapis.com/maps/api/js?key=AIzaSyBCHtKGx3yXWZZ7_gwtJKG8a_6hArEFefs", () => {
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
                    GUI.closeContent()
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
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType
            });
            control.on('click',(evt) => {
              this.showMarker(evt.coordinates);
            });
            control.on('error', (e) => {
              GUI.notify.error(t("mapcontrols.geolocations.error"))
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

// get layers from layersstore
proto.getLayers = function(filter) {
  filter = filter || {};
  const mapFilter = {
    GEOLAYER: true
  };
  Object.assign(filter, mapFilter);
  let layers = [];
  _.forEach(MapLayersStoreRegistry.getQuerableLayersStores(), function(layerStore) {
    _.merge(layers, layerStore.getLayers(filter));
  });
  return layers;
};

proto.filterableLayersAvailable = function() {
  const layers = this.getLayers({
    QUERYABLE: true,
    FILTERABLE: true,
    SELECTEDORALL: true
  });
  return layers.some((layer) => {
    // case filter of WFS check if layer has the same projection of map, QGIS server doesn't support reprojection in WFS
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
  ControlsRegistry.registerControl(type, control);
};

proto.showControl = function(type) {
  this.showControls([type]);
};

proto.hideControl = function(type) {
  this.hideControls([type]);
};

proto.showControls = function(types) {
  this.toggleControls(true,types);
};

proto.hideControls = function(types) {
 this.toggleControls(false,types);
};

proto.showAllControls = function() {
  this.toggleControls(true);
};

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
    if (controlObj.control.isToggled && controlObj.control.isToggled()) {
      controlObj.control.toggle(false);
      GUI.closeContent();
    }
  });

};

proto.addMapLayers = function(mapLayers) {
  mapLayers.reverse().forEach((mapLayer) => {
    this.addMapLayer(mapLayer)
  })
};

proto.addMapLayer = function(mapLayer) {
  this._mapLayers.push(mapLayer);
  this.addLayerToMap(mapLayer)
};

proto.getMapLayers = function() {
  return this._mapLayers;
};

proto.getBaseLayers = function() {
  return this.mapBaseLayers;
};

proto.getMapLayerForLayer = function(layer) {
  let mapLayer;
  const multilayerId = 'layer_'+layer.getMultiLayerId();
  const mapLayers = this.getMapLayers();
  mapLayers.find((_mapLayer) => {
    if (_mapLayer.getId() == multilayerId) {
      mapLayer = _mapLayer;
      return true;
    }
  });
  return mapLayer;
};

proto.getProjectLayer = function(layerId) {
  let layer = null;
  MapLayersStoreRegistry.getLayersStores().some((layerStore) => {
    layer = layerStore.getLayerById(layerId);
    return layer
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

// set view based on project config
proto._setupViewer = function(width,height) {
  const projection = this.getProjection();
  const initextent = this.project.state.initextent;
  const extent = this.project.state.extent;
  const maxxRes = ol.extent.getWidth(extent) / width;
  const minyRes = ol.extent.getHeight(extent) / height;
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

  $(this.viewer.map.getViewport()).prepend('<div id="map-spinner" style="position:absolute; top: 50%; right: 50%"></div>');

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

// remove all events of layersStore
proto._removeEventsKeysToLayersStore = function(layerStore) {
  const layerStoreId = layerStore.getId();
  if (this._layersStoresEventKeys[layerStoreId]) {
    this._layersStoresEventKeys[layerStoreId].forEach((eventObj) => {
      _.forEach(eventObj, function(eventKey, event) {
        layerStore.un(event, eventKey);
      })
    });
    delete this._layersStoresEventKeys[layerStoreId];
  }
};

// register all events of layersStore and relative keys
proto._setUpEventsKeysToLayersStore = function(layerStore) {
  const layerStoreId = layerStore.getId();
  // check if already store a key of events
  if (!this._layersStoresEventKeys[layerStoreId]) {
    this._layersStoresEventKeys[layerStoreId] = [];

    //SETVISIBILITY EVENT
    const layerVisibleKey = layerStore.onafter('setLayersVisible',  (layersIds) => {
     layersIds.forEach((layerId) => {
        const layer = layerStore.getLayerById(layerId);
        const mapLayer = this.getMapLayerForLayer(layer);
        if (mapLayer)
          this.updateMapLayer(mapLayer)
      });
    });
    this._layersStoresEventKeys[layerStoreId].push({
      setLayersVisible: layerVisibleKey
    });

    //ADD LAYER
    const addLayerKey = layerStore.onafter('addLayer', (layer) => {
      if (layer.getType() == 'vector') {
        const mapLayer = layer.getMapLayer();
        this.addLayerToMap(mapLayer);
      }
    });

    this._layersStoresEventKeys[layerStoreId].push({
      addLayer: addLayerKey
    });

    // REMOVE LAYER
    const removeLayerKey = layerStore.onafter('removeLayer',  (layer) => {
      if (layer.getType() == 'vector') {
        const olLayer = layer.getOLLayer();
        this.viewer.map.removeLayer(olLayer);
      }
    });

    this._layersStoresEventKeys[layerStoreId].push({
      removeLayer: removeLayerKey
    });
  }
};

proto._setupListeners = function() {
  this._setBaseLayerListenerKey = this.project.onafter('setBaseLayer',() => {
    this.updateMapLayers();
  });
};

// SETUP ALL LAYERS
proto._setupLayers = function() {
  this._setupBaseLayers();
  const mapLayers = this._setupMapLayers();
  this.addMapLayers(mapLayers);
  this.updateMapLayers();
  this._setupVectorLayers();
  // on change resolution call update of each mapLayers
  this.viewer.map.getView().on("change:resolution", (evt) => {
    this._updateMapView();
  });
};

proto.removeLayers = function() {
  this.viewer.removeLayers();
};

proto.addLayerToMap = function(layer) {
  const olLayer = layer.getOLLayer();
  if (olLayer)
    this.getMap().addLayer(olLayer);
};

//SETUPA BASELAYERS
proto._setupBaseLayers = function(){
  const baseLayers = this.getLayers({
    BASELAYER: true
  });
  if (!baseLayers.length){
    return;
  }
  this.mapBaseLayers = {};
  baseLayers.forEach((layer) => {
    const baseMapLayer = layer.getMapLayer();
    this.registerMapLayerListeners(baseMapLayer);
    this.mapBaseLayers[layer.getId()] = baseMapLayer;
  });
  const reverseBaseLayers = Object.values(this.mapBaseLayers).reverse();
  reverseBaseLayers.forEach((baseMapLayer) => {
    baseMapLayer.update(this.state, this.layersExtraParams);
    this.addLayerToMap(baseMapLayer)
  });
};

//SETUP VECTORLAYERS
proto._setupVectorLayers = function() {
  const layers = this.getLayers({
    VECTORLAYER: true
  });
  layers.forEach((layer) => {
    const mapVectorLayer = layer.getMapLayer();
    this.addLayerToMap(mapVectorLayer)
  })
};

//SETUP MAPLAYERS
proto._setupMapLayers = function() {
  const layers = this.getLayers({
    BASELAYER: false,
    VECTORLAYER: false
  });
  //group layer by mutilayer
  const multiLayers = _.groupBy(layers, function(layer) {
    return layer.getMultiLayerId();
  });
  let mapLayers = [];
  Object.entries(multiLayers).forEach(([id, layers]) => {
    const multilayerId = 'layer_'+id;
    let mapLayer;
    const layer = layers[0];
    if (layers.length == 1) {
      mapLayer = layer.getMapLayer({
        id: multilayerId,
        projection: this.getProjection()
      });
      this.registerMapLayerListeners(mapLayer);
      mapLayer.addLayer(layer);
      mapLayers.push(mapLayer)
    } else {
      mapLayer = layer.getMapLayer({
            id: multilayerId,
            projection: this.getProjection()
          }, this.layersExtraParams);
      this.registerMapLayerListeners(mapLayer);
      layers.reverse().forEach((sub_layer) => {
        mapLayer.addLayer(sub_layer);
      });
      mapLayers.push(mapLayer)
    }
  });

  return mapLayers;
};

proto.getOverviewMapLayers = function(project) {
  const WMSLayer = require('core/layers/map/wmslayer');
  const projectLayers = project.getLayersStore().getLayers({
    GEOLAYER: true,
    BASELAYER: false,
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

proto.updateMapLayer = function(mapLayer) {
  mapLayer.update(this.state, this.getResolution())
};

// run update function on ech mapLayer
proto.updateMapLayers = function() {
  this.getMapLayers().forEach((mapLayer) => {
    this.updateMapLayer(mapLayer)
  });
  const baseLayers = this.getBaseLayers();
  //updatebase layer
  Object.entries(baseLayers).forEach(([layerid, baseLayer]) => {
    baseLayer.update(this.state, this.layersExtraParams);
  })
};

// register map Layer listeners of creation
proto.registerMapLayerListeners = function(mapLayer) {
  mapLayer.on('loadstart', this._incrementLoaders.bind(this) );
  mapLayer.on('loadend', this._decrementLoaders.bind(this)) ;
};

// unregister listeners of mapLayers creation
proto.unregisterMapLayerListeners = function(mapLayer) {
  mapLayer.un('loadstart', this._incrementLoaders );
  mapLayer.un('loadend', this._decrementLoaders );
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
  bbox = this.isAxisOrientationInverted() ? [bbox[1], bbox[0], bbox[3], bbox[2]] : bbox;
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

proto.highlightGeometry = function(geometryObj, options) {
  this.clearHighlightGeometry();
  options = options || {};
  let zoom = (typeof options.zoom == 'boolean') ? options.zoom : true;
  const highlight = (typeof options.highlight == 'boolean') ? options.highlight : true;
  const duration = options.duration || 2000;
  let geometry;
  if (geometryObj instanceof ol.geom.Geometry){
    geometry = geometryObj;
  } else {
    let format = new ol.format.GeoJSON;
    geometry = format.readGeometry(geometryObj);
  }
  const geometryType = geometry.getType();
  if (zoom) {
    if (geometryType == 'Point' || (geometryType == 'MultiPoint' && geometry.getPoints().length == 1)) {
      const coordinates = geometryType == 'Point' ? geometry.getCoordinates() : geometry.getPoint(0).getCoordinates();
      if (this.project.state.crs != 4326 && this.project.state.crs != 3857) {
        const res = this.getResolutionForMeters(100);
        this.goToRes(coordinates,res);
      } else {
        zoom = this.viewer.map.getView().getZoom() > 6 ? this.viewer.map.getView().getZoom() : 6;
        this.goTo(coordinates, zoom);
      }
    } else {
      this.viewer.fit(geometry, options);
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

proto.refreshMap = function() {
  this._mapLayers.forEach((mapLayer) => {
    mapLayer.getOLLayer().getSource().updateParams({"time": Date.now()});
  });
};

// called when layout (window) resize
proto.layout = function(width, height) {
  if (!this.viewer) {
    this.setupViewer(width,height);
  }
  if (this.viewer) {
    this.setHidden((width == 0 || height == 0));
    this.getMap().updateSize();
    this._updateMapView();
  }
};

// function to remove maplayers
proto._removeMapLayers = function() {
  this.getMapLayers().forEach((mapLayer) => {
    this.unregisterMapLayerListeners(mapLayer);
    this.viewer.map.removeLayer(mapLayer.getOLLayer());
  });
  this._mapLayers = [];
};

proto.getMapBBOX = function() {
  return this.viewer.getBBOX();
};

proto._updateMapView = function() {
  const bbox = this.viewer.getBBOX();
  const resolution = this.viewer.getResolution();
  const center = this.viewer.getCenter();
  this.updateMapView(bbox, resolution, center);
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
  const type = options.type || 'coordinate';
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

// grey map precompose mapcompose
proto.startDrawGreyCover = function() {
  // after rendering the layer, restore the canvas context
  const map = this.viewer.map;
  let x_min, x_max, y_min, y_max, rotation, scale;
  //check if exist an listener
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
    // end external bbox (map is cover)
    if (this._drawShadow.inner.length) {
      ctx.save();
      x_min = this._drawShadow.inner[0];
      y_min = this._drawShadow.inner[3];
      x_max = this._drawShadow.inner[2];
      y_max = this._drawShadow.inner[1];
      rotation = this._drawShadow.rotation;
      scale = this._drawShadow.scale;
      // Inner polygon,must be counter-clockwise antiorario
      ctx.translate((x_max+x_min)/2, (y_max+y_min)/2);
      ctx.rotate(rotation*Math.PI / 180);
      ctx.moveTo(-((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.lineTo(((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.lineTo(((x_max-x_min)/2),-((y_max-y_min)/2));
      ctx.lineTo(-((x_max-x_min)/2),-((y_max-y_min)/2));
      ctx.lineTo(-((x_max-x_min)/2),((y_max-y_min)/2));
      ctx.closePath();
      // end inner bbox
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

proto.removeExternalLayer = function(name) {
  const layer = this.getLayerByName(name);
  const catalogService = GUI.getComponent('catalog').getService();
  const QueryResultService = GUI.getComponent('queryresults').getService();
  QueryResultService.unregisterVectorLayer(layer);
  this.viewer.map.removeLayer(layer);
  catalogService.removeExternalLayer(name);
};

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
  let layer_epsg = crs;
  let data = externalLayer.data;
  const catalogService = GUI.getComponent('catalog').getService();
  const QueryResultService = GUI.getComponent('queryresults').getService();
  const layer = this.getLayerByName(name);
  const loadExternalLayer = (format, data, epsg=layer_epsg) => {
    features = format.readFeatures(data, {
      dataProjection: epsg,
      featureProjection: this.getEpsg()
    });
    vectorSource = new ol.source.Vector({
      features: features
    });
    vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      name: name
    });
    vectorLayer.setStyle(this.setExternalLayerStyle(color));
    extent = vectorLayer.getSource().getExtent();
    externalLayer.bbox = {
      minx: extent[0],
      miny: extent[1],
      maxx: extent[2],
      maxy: extent[3]
    };
    map.addLayer(vectorLayer);
    QueryResultService.registerVectorLayer(vectorLayer);
    catalogService.addExternalLayer(externalLayer);
    map.getView().fit(vectorSource.getExtent());
  };

  if (!layer) {
    if (layer_epsg != this.getCrs()) {
      if (layer_epsg == 'EPSG:3003')
        Projections.get("EPSG:3003", "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs");
    }
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
        shpToGeojson({
          url: data,
          encoding: 'big5',
          EPSG: crs
        }, (geojson) => {
          data = JSON.stringify(geojson);
          format = new ol.format.GeoJSON({});
          loadExternalLayer(format, data, "EPSG:4326");
        });
        break;
    }
  } else {
    GUI.notify.info(t("layer_is_added"));
  }
};

proto.setExternalLayerStyle = function(color) {
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
