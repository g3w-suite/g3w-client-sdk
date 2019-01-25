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
const VectorLayer = require('core/layers/vectorlayer');
const debounce = require('core/utils/utils').debounce;
const throttle = require('core/utils/utils').throttle;

function MapService(options={}) {
  this.id = 'MapService';
  this.viewer = null;
  this.target = options.target || null;
  this.maps_container = options.maps_container || null;
  this._layersStoresEventKeys = {};
  this.project   = null;
  this._mapControls = [];
  this._mapLayers = [];
  this.mapBaseLayers = {};
  this.layersExtraParams = {};
  this.state = {
    bbox: [],
    hidemaps:[],
    resolution: null,
    center: null,
    loading: false,
    hidden: true,
    scale: 0,
    mapcontrolsalignement: 'rv',
    mapcontrolDOM: null,
    mapcontrolready: false,
    mapcontrolSizes: {
      height: 47,
      width: 47,
      minWidth: 47,
      minHeight: 47
    },
    mapControl: {
      grid: [],
      length: 0,
      currentIndex: 0
    },
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
    addHideMap: function({layers=[], mainview=false, switchable=false} = {}) {
      const id = 'hidemap_'+ Date.now();
      const idMap = {
        id,
        map: null,
        switchable
      };
      this.state.hidemaps.push(idMap);
      return idMap;

    },
    updateMapView: function(bbox, resolution, center) {
      this.state.bbox = bbox;
      this.state.resolution = resolution;
      this.state.center = center;
      this.updateMapLayers();
    },
    setHidden: function(bool) {
      this.state.hidden = bool;
    },
    setupViewer: function(width,height) {
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
      this._setupLayers();
      this.setupControls();
      this.emit('viewerset');
    },
    controlClick: function(active) {
      //SETTER to register map control activated
    }
  };

  this._onCatalogSelectLayer = function(layer) {
    if (layer && layer.isQueryable()) {
      for (let i = 0; i< this._mapControls.length; i++) {
        const mapcontrol = this._mapControls[i];
        if (mapcontrol.control._onSelectLayer && mapcontrol.control.getGeometryTypes().indexOf(layer.getGeometryType()) > -1) {
          mapcontrol.control.setEnable(layer.isVisible());
          // listen changes
          this.on('cataloglayertoggled', (_toggledLayer) => {
            if (layer === _toggledLayer) {
              mapcontrol.control.setEnable(layer.isVisible())
            }
          })
        }
      }
    }
  };


  this.on('cataloglayerselected', this._onCatalogSelectLayer);

  this._onCatalogUnSelectLayer = function() {
    for (let i = 0; i< this._mapControls.length; i++) {
      const mapcontrol = this._mapControls[i];
      mapcontrol.control._onSelectLayer && mapcontrol.control.setEnable(false);
      this.removeAllListeners('cataloglayertoggled')
    }
  };

  this.on('cataloglayerunselected', this._onCatalogUnSelectLayer);

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

proto._addHideMap = function({layers=[], mainview=false} = {}) {
  const idMap = this.state.hidemaps[this.state.hidemaps.length - 1 ];
  const view = this.getMap().getView();
  const view_options = {
    projection: view.getProjection(),
    center: view.getCenter(),
    resolution: this.getResolution()
  };
  const viewer = ol3helpers.createViewer({
    id: idMap.id,
    view: mainview ? view: view_options
  });
  // set Map
  idMap.map = viewer.getMap();

  for (let i=0; i < layers.length; i++) {
    const layer = layers[i];
    idMap.map.addLayer(layer);
  }
  return idMap.map;
};

proto.removeHideMap = function(id) {
  let index;
  for (let i = 0; i < this.state.hidemaps.length; i++) {
    if (id === this.state.hidemaps[i].id){
      index = i;
      break;
    }
  }
  if (index !== undefined)
    this.state.hidemaps.splice(index,1);
};

proto._showHideMapElement = function({map, show=false} = {}) {
  show ? $(map.getTargetElement()).addClass('show') : $(map.getTargetElement()).removeClass('show');
};

proto.createMapImage = function({map, background} = {}) {
  return new Promise((resolve, reject) => {
    try {
     const canvas = this.getMapCanvas(map);
      if (navigator.msSaveBlob) {
        resolve(canvas.msToBlob());
      } else {
        canvas.toBlob(function(blob) {
          resolve(blob);
        });
      }
    } catch (err) {
      reject(err);
    }
  })
};

proto.getApplicationAttribution = function() {
  const {header_terms_of_use_link, header_terms_of_use_text} = this.config.group;
  if (header_terms_of_use_text) {
    return `<a href="${header_terms_of_use_link}">${header_terms_of_use_text}</a>`;
  } else {
    return false
  }
};

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

proto.getMapCanvas = function(map) {
  let viewport;
  if (!map)
    viewport = $(`#${this.maps_container} .g3w-map`).last().children('.ol-viewport')[0];
  else {
    viewport = map.getViewport();
  }
  return $(viewport).children('canvas')[0];
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

proto.getQueryLayerByCoordinates = function({layer, coordinates} = {}) {
  const mapProjection = this.getProjection();
  const resolution = this.getResolution();
  return new Promise((resolve, reject) => {
    layer.query({
      coordinates,
      mapProjection,
      resolution
    })
      .then((response) => {
        resolve(response)
      })
      .fail((err) => {
        reject(err)
      })
  })
};

proto.getQueryLayerPromiseByCoordinates = function({layer, coordinates} = {}) {
  return new Promise((resolve, reject) => {
    const mapProjection = this.getProjection();
    const resolution = this.getResolution();
    layer.query({
      coordinates,
      mapProjection,
      resolution
    }).then((response) => {
      resolve(response)
    }).fail((error)=> {
      reject(error);
    })
  })
};

proto.getQueryLayersPromisesByCoordinates = function(layerFilterObject, coordinates) {
  const d = $.Deferred();
  const layers = this.getLayers(layerFilterObject);
  const queryResponses = [];
  const mapProjection = this.getProjection();
  const resolution = this.getResolution();
  let layersLenght = layers.length;
  layers.forEach((layer) => {
    layer.query({
      coordinates,
      mapProjection,
      resolution
    }).then((response) => {
      queryResponses.push(response)
    }).always(() => {
      layersLenght -= 1;
      if (layersLenght === 0)
        d.resolve(queryResponses)
    })
  });
  return d.promise();
};

//setup controls
/*
  layout : {
    lv: <options> h : horizontal (default), v vertical
    lh: <options> h: horizontal: v vertical (default)
  }
 */

proto.activeMapControl = function(controlName) {
  const mapControl = this._mapControls.find((control) => control.type === controlName);
  const control = mapControl.control;
  !control.isToggled() ? control.toggle() : null;
};
proto.setupControls = function() {
  //this.state.mapcontrolsalignement = 'lv'
  const baseLayers = this.getLayers({
    BASELAYER: true
  });
  this.getMapLayers().forEach((mapLayer) => {
    mapLayer.getSource().setAttributions(this.getApplicationAttribution())
  });
  // check if base layer is set. If true add attribution control
  if (this.getApplicationAttribution() || baseLayers.length) {
    const attributionControl =  new ol.control.Attribution({
      collapsible: false
    });
    this.getMap().addControl(attributionControl);
  }
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
          this.addControl(controlType, control, false);
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
          control = ControlsFactory.create({
            type: controlType,
            label: "\ue98c",
            extent: this.project.state.initextent
          });
          this.addControl(controlType,control);
          break;
        case 'mouseposition':
          if (!isMobile.any) {
            const coordinateLabels = this.getProjection().getUnits() === 'm' ? ['X', 'Y'] : ['Lng', 'Lat'];
            control = ControlsFactory.create({
              type: controlType,
              coordinateFormat: (coordinate) => {
                return ol.coordinate.format(coordinate, `${coordinateLabels[0]}: {x}, ${coordinateLabels[1]}: {y}`, 4);
              },
              projection: this.getCrs()
            });
            this.addControl(controlType, control, false);
          }
          break;
        case 'screenshot':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType,
              onclick: async () => {
                try {
                  const blobImage = await this.createMapImage();
                  saveAs(blobImage, `map_${Date.now()}.png`);
                } catch (e) {
                  GUI.notify.error(t("info.server_error"));
                }
                return true;
              }
            });
            this.addControl(controlType, control);
          }
          break;
        case 'scale':
          control = ControlsFactory.create({
            type: controlType,
            coordinateFormat: ol.coordinate.createStringXY(4),
            projection: this.getCrs(),
            isMobile: isMobile.any
          });
          this.addControl(controlType, control, false);
          break;
        // single query control
        case 'query':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('picked', throttle((e) => {
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

            let queryResultsPromise = this.getQueryLayersPromisesByCoordinates(layersFilterObject, coordinates);
            const queryResultsPanel = showQueryResults('');
            queryResultsPromise.then((responses) => {
                layersResults = responses;
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
              });
          }));
          this.addControl(controlType,control);
          //set active control by default
          control.toggle();
          break;
        case 'querybypolygon':
          const controlLayers = this.getLayers({
            QUERYABLE: true,
            SELECTEDORALL: true
          });
          control = ControlsFactory.create({
            type: controlType,
            layers: controlLayers,
            help: t("sdk.mapcontrols.querybypolygon.help")
          });
          if (control) {
            const showQueryResults = GUI.showContentFactory('query');
            control.on('picked', throttle((e) => {
              let results = {};
              let geometry;
              const coordinates = e.coordinates;
              this.getMap().getView().setCenter(coordinates);
              let layersFilterObject = {
                QUERYABLE: true,
                SELECTED: true,
                VISIBLE: true
              };
              let queryResulsPromise = this.getQueryLayersPromisesByCoordinates(layersFilterObject, coordinates);
              queryResulsPromise.then((responses) => {
                let layersResults = responses;
                const queryPromises = [];
                results = {};
                // unify results of the promises
                results.query = layersResults[0] ? layersResults[0].query : null;
                if(layersResults[0] && layersResults[0].data && layersResults[0].data.length) {
                  geometry = layersResults[0].data[0].features[0].getGeometry();
                  if(geometry) {
                    let filter = new Filter();
                    let layerFilterObject = {
                      ALLNOTSELECTED: true,
                      FILTERABLE: true,
                      VISIBLE: true
                    };
                    const layers = this.getLayers(layerFilterObject);
                    const mapCrs = this.getCrs();
                    let filterGeometry = geometry;
                    layers.forEach((layer) => {
                      const layerCrs = layer.getProjection().getCode();
                      if(mapCrs != layerCrs)
                        filterGeometry = geometry.clone().transform(mapCrs, layerCrs);
                      filter.setGeometry(filterGeometry);
                      queryPromises.push(layer.query({
                        filter
                      }))
                    });
                    this.highlightGeometry(geometry);
                  }
                  const queryResultsPanel = showQueryResults('');
                  $.when.apply(this, queryPromises)
                    .then((...args) => {
                      layersResults = args;
                      const results = {
                        query: layersResults[0] ? layersResults[0].query : null,
                        data: []
                      };
                      _.forEach(layersResults, function (result) {
                        result.data ? results.data.push(result.data[0]) : null;
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
            }));
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
              layers: controlLayers,
              help: t("sdk.mapcontrols.querybybbox.help")
            });
            if (control) {
              control.on('bboxend', (e) => {
                let bbox = e.extent;
                let filterBBox = bbox;
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
                  const mapCrs = this.getCrs();
                  const layerCrs = layer.getProjection().getCode();
                  if (mapCrs != layerCrs) {
                   const geometry = ol.geom.Polygon.fromExtent(bbox);
                    filterBBox = geometry.transform(mapCrs, layerCrs).getExtent();
                  }
                  filter.setBBOX(filterBBox);
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
          control = ControlsFactory.create({
            type: controlType
          });
          control.setProjection(this.getProjection());
          this.addControl(controlType, control);
          this.on('viewerset', () => {
            this.viewer.map.addLayer(control.getLayer());
          });
          if (!isMobile.any) {
            $script("https://maps.googleapis.com/maps/api/js?key=AIzaSyBCHtKGx3yXWZZ7_gwtJKG8a_6hArEFefs", () => {
              let position = {
                lat: null,
                lng: null
              };
              const closeContentFnc = () => {
                control.clearMarker();
              };
              const streetViewService = new StreetViewService();
              streetViewService.onafter('postRender', (position) => {
                control.setPosition(position);
              });
              if (control) {
                this._setMapControlVisible({
                  control,
                  visible: true
                });
                control.on('picked', throttle((e) => {
                  GUI.off('closecontent', closeContentFnc);
                  const coordinates = e.coordinates;
                  const lonlat = ol.proj.transform(coordinates, this.getProjection().getCode(), 'EPSG:4326');
                  position.lat = lonlat[1];
                  position.lng = lonlat[0];
                  streetViewService.showStreetView(position);
                  GUI.on('closecontent', closeContentFnc);
                }));
                control.on('disabled', () => {
                  GUI.closeContent();
                  GUI.off('closecontent', closeContentFnc);
                  })
                }
            })
          }
          break;
        case 'scaleline':
          control = ControlsFactory.create({
            type: controlType,
            position: 'br'
          });
          this.addControl(controlType,control, false);
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
                  collapseLabel: $(`<span class="${GUI.getFontClass('arrow-left')}"></span>`)[0],
                  label: $(`<span class="${GUI.getFontClass('arrow-right')}"></span>`)[0],
                  collapsed: false,
                  layers: overViewMapLayers,
                  view: new ol.View({
                    projection: this.getProjection()
                  })
                });
                this.addControl(controlType,control, false);
              });
            }
          }
          break;
        case 'nominatim':
          control = ControlsFactory.create({
            type: controlType,
            isMobile: isMobile.any,
            bbox: this.project.state.initextent,
            mapCrs: 'EPSG:'+this.project.state.crs,
            placeholder: t("mapcontrols.nominatim.placeholder"),
            noresults: t("mapcontrols.nominatim.noresults"),
            notresponseserver: t("mapcontrols.nominatim.notresponseserver"),
            fontIcon: GUI.getFontClass('search')
          });
          control.on('addresschosen', (evt) => {
            const coordinate = evt.coordinate;
            const geometry =  new ol.geom.Point(coordinate);
            this.highlightGeometry(geometry);
          });

          this.addControl(controlType, control, false);

          $('#search_nominatim').click(debounce(() => {
            control.nominatim.query($('input.gcd-txt-input').val());
          }));
          $('.gcd-txt-result').perfectScrollbar();
          break;
        case 'geolocation':
          control = ControlsFactory.create({
            type: controlType
          });
          control.on('click', throttle((evt) => {
            this.showMarker(evt.coordinates);
          }));
          control.on('error', (e) => {
            GUI.notify.error(t("mapcontrols.geolocations.error"))
          });
          this.addControl(controlType, control);
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
              type: controlType,
              tipLabel: t('mapcontrols.length.tooltip')
            });
            this.addControl(controlType, control);
          }
          break;
        case 'area':
          if (!isMobile.any) {
            control = ControlsFactory.create({
              type: controlType,
              tipLabel: t('mapcontrols.area.tooltip')
            });
            this.addControl(controlType, control);
          }
          break;
      }
    });
    this._setMapControlsInsideContainerLenght();
    this.state.mapcontrolready = true;
  }
};

proto._setMapControlsGrid = function(length) {
  const grid = this.state.mapControl.grid;
    if (length < 2) {
      const rC = grid[grid.length - 1];
      grid.push({
        rows: rC.rows * 2 ,
        columns: 2
      });
      return;
    }
    if (length === 2) {
      if (grid.length) {
        const rC = grid[grid.length - 1];
        grid.push({
          rows: rC.columns ,
          columns: rC.rows
        })
      } else {
        grid.push({
          rows: 1,
          columns: 2
        })
      }
    } else if (length === 3) {
      const rC = grid[grid.length - 1];
      grid.push({
        rows: 2 * rC.rows,
        columns: length
      })
    } else {
      grid.push({
        rows: grid.length + 1 + (Number.isInteger(length) ? 0 : 1),
        columns: Number.isInteger(length) ? length: parseInt(length) + 1
      });
      const _length = Number.isInteger(length) ? length: parseInt(length);
      this._setMapControlsGrid(_length/2);
    }
};

proto._setMapControlsInsideContainerLenght = function() {
  this.state.mapControl.length = 1;
  // count the mapcontrol insied g3w-map-control container
  this._mapControls.forEach((control) => {
    const map = this.getMap();
    this.state.mapControl.length+=control.mapcontrol ? 1: 0;
    control.control.changelayout ? control.control.changelayout(map) : null;
  });
  // add 1 id odd number
  this.state.mapControl.length += this.state.mapControl.length% 2;
  this._setMapControlsGrid(this.state.mapControl.length);
};

// get layers from layersstore
proto.getLayers = function(filter) {
  filter = filter || {};
  const mapFilter = {
    GEOLAYER: true
  };
  Object.assign(filter, mapFilter);
  let layers = [];
  MapLayersStoreRegistry.getQuerableLayersStores().forEach((layerStore) => {
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
    return layer.getProvider('filter') instanceof WFSProvider;
  });
};

proto.setMapControlsAlignement = function(alignement='rv') {
  this.state.mapcontrolsalignement = alignement;
};

proto.getMapControlsAlignement = function() {
  return this.state.mapcontrolsalignement
};

proto.isMapControlsVerticalAlignement = function() {
  return this.state.mapcontrolsalignement.indexOf('v') != -1;
};

proto.setMapControlsVerticalAlignement = function() {
  this.state.mapcontrolsalignement = this.state.mapcontrolsalignement[0] + 'v';
};

proto.setMapControlsHorizontalAlignement = function() {
  this.state.mapcontrolsalignement = this.state.mapcontrolsalignement[0] + 'h';
};

proto.flipControlsHorizontally = function() {
  this.state.mapcontrolsalignement = this.state.mapcontrolsalignement[0] === 'r' ? 'l' + this.state.mapcontrolsalignement[1] : 'r' + this.state.mapcontrolsalignement[1]
};

proto.flipMapControlsVertically = function() {
  this.state.mapcontrolsalignment = this.state.mapcontrolsalignement[1] === 'v' ? this.state.mapcontrolsalignement[0] + 'h' :  this.state.mapcontrolsalignement[0] + 'v'
};

proto.setMapControlsContainer = function(mapControlDom) {
  this.state.mapcontrolDOM = mapControlDom;
};

proto._updateMapControlsLayout = function({width, height}) {
  // update only when all control are ready
  if (this.state.mapcontrolready) {
    let changed = false;
    // count the mapcontrol insied g3w-map-control container
    this._mapControls.forEach((control) => {
      const map = this.getMap();
      control.control.changelayout ? control.control.changelayout(map) : null;
    });
    // check if is vertical
    if (this.isMapControlsVerticalAlignement()) {
      let mapControslHeight = this.state.mapControl.grid[this.state.mapControl.currentIndex].columns * this.state.mapcontrolSizes.minWidth;
      // get bottom controls
      const bottomMapControls =  $(`.ol-control-b${this.getMapControlsAlignement()[0]}`);
      const bottomMapControlTop = bottomMapControls.length ? $(bottomMapControls[bottomMapControls.length - 1]).position().top: mapControslHeight;
      const freeSpace = bottomMapControlTop > 0 ? bottomMapControlTop - mapControslHeight : height - mapControslHeight;
      if (freeSpace < 10) {
        if (isMobile.any) {
          this.setMapControlsAlignement('rh');
          return;
        } else {
          this.state.mapControl.currentIndex = this.state.mapControl.currentIndex === this.state.mapControl.grid.length - 1 ? this.state.mapControl.currentIndex : this.state.mapControl.currentIndex +1;
        }
        changed = true;
      } else {
        // check if there enought space to expand mapcontrols
        const nextHeight = this.state.mapControl.currentIndex > 0 ? (this.state.mapControl.grid[this.state.mapControl.currentIndex -1].columns * this.state.mapcontrolSizes.minWidth) - mapControslHeight : mapControslHeight;
        if (freeSpace  > nextHeight) {
          changed = true;
          this.state.mapControl.currentIndex = this.state.mapControl.currentIndex === 0 ? this.state.mapControl.currentIndex : this.state.mapControl.currentIndex  - 1;
        }
      }
      if (changed) {
        mapControslHeight = this.state.mapControl.grid[this.state.mapControl.currentIndex].columns * this.state.mapcontrolSizes.minWidth;
        mapControlsWidth = this.state.mapControl.grid[this.state.mapControl.currentIndex].rows * this.state.mapcontrolSizes.minWidth;
        this.state.mapcontrolDOM.css('height', `${mapControslHeight}px`);
        this.state.mapcontrolDOM.css('width', `${mapControlsWidth}px`);
      }
    } else {
      if (isMobile.any) {
        this.setMapControlsAlignement('rv');
      }
    }
  }
};

proto._setMapControlVisible = function({control, visible=true}) {
   control && (visible && $(control.element).show() || $(control.element).hide());
};

proto._addControlToMapControls = function(control, visible=true) {
  const controlElement = control.element;
  if (!visible)
    control.element.style.display = "none";
  $('.g3w-map-controls').append(controlElement)
};

proto.addControl = function(type, control, addToMapControls=true, visible=true) {
  this.viewer.map.addControl(control);
  this._mapControls.push({
    type: type,
    control: control,
    visible,
    mapcontrol: addToMapControls && visible
  });
  control.on('controlclick', (active) => {
    this.controlClick(active);
  });

  $(control.element).find('button').tooltip({
    placement: 'bottom',
    trigger : 'hover'
  });

  if (addToMapControls)
    this._addControlToMapControls(control, visible);
  else {
    const $mapElement = $(`#${this.getMap().getTarget()}`);
    this._updateMapControlsLayout({
      width: $mapElement.width(),
      height: $mapElement.height()
    })
  }

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

proto._unToggleControls = function({close=true} = {}) {
  this._mapControls.forEach((controlObj) => {
    if (controlObj.control.isToggled && controlObj.control.isToggled()) {
      controlObj.control.toggle(false);
      close && GUI.closeContent();
    }
  });
};

proto.deactiveMapControls = function() {
  this._unToggleControls({
    close: false
  })
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
  let mapLayer = null;
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
  return MapLayersStoreRegistry.getLayerById(layerId);
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
    //maxResolution: maxResolution
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
  const resolution = Math.max(initxRes,inityRes);
  const center = ol.extent.getCenter(initextent);
  this.viewer = ol3helpers.createViewer({
    id: this.target,
    view: {
      projection,
      center,
      extent,
      maxResolution,
      resolution
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
      if (layer.getType() === 'vector') {
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

proto._setMapProjectionToLayers = function(layers) {
  // setup mapProjection on ech layers
  layers.forEach((layer) => {
    layer.setMapProjection(this.getProjection())
  });
};

//SETUP VECTORLAYERS
proto._setupVectorLayers = function() {
  const layers = this.getLayers({
    VECTORLAYER: true
  });
  this._setMapProjectionToLayers(layers);
  layers.forEach((layer) => {
    const mapVectorLayer = layer.getMapLayer();
    this.addLayerToMap(mapVectorLayer)
  })
};

proto.createMapLayer = function(layer) {
  layer.setMapProjection(this.getProjection());
  const multilayerId = 'layer_'+layer.getMultiLayerId();
  const mapLayer = layer.getMapLayer({
    id: multilayerId,
    projection: this.getProjection()
  }, this.layersExtraParams);
  mapLayer.addLayer(layer);
 return mapLayer;
};

//SETUP MAPLAYERS
proto._setupMapLayers = function() {
  const layers = this.getLayers({
    BASELAYER: false,
    VECTORLAYER: false
  });
  this._setMapProjectionToLayers(layers);
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

proto.updateMapLayer = function(mapLayer, options={force: false}) {
  if (!options.force)
    mapLayer.update(this.state, this.getResolution());
  else
    mapLayer.update(this.state, {"time": Date.now()})
};

// run update function on ech mapLayer
proto.updateMapLayers = function(options) {
  this.getMapLayers().forEach((mapLayer) => {
    this.updateMapLayer(mapLayer, options)
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

proto.setTarget = function(elId) {
  this.target = elId;
};

proto.addInteraction = function(interaction, close) {
  this._unToggleControls({
    close
  });
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

proto.zoomToFeatures = function(features, options) {
  let extent;
  for (let i=0; i < features.length; i++) {
    const feature = features[i];
    const geometry = feature.getGeometry ? feature.getGeometry() : feature.geometry;
    extent = !extent ? geometry.getExtent() : ol.extent.extend(extent, geometry.getExtent())
  }
  this.zoomToExtent(extent, options);
};

proto.zoomToExtent = function(extent, options={}) {
  const map = this.getMap();
  const {maxZoom=8} = options;
  map.getView().fit(extent, {
    size: map.getSize(),
    maxZoom
  });
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

proto.highlightGeometry = function(geometryObj, options = {}) {
  this.clearHighlightGeometry();
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
      setTimeout(() => {
        highlightLayer.getSource().clear();
        animatingHighlight = false;
      }, duration)
    }
  }
};

proto.clearHighlightGeometry = function() {
  if (highlightLayer && ! animatingHighlight) {
    highlightLayer.getSource().clear();
  }
};

proto.refreshMap = function(options) {
  this.updateMapLayers(options);
};

// called when layout (window) resize
proto.layout = function({width, height}) {
  if (!this.viewer) {
    this.setupViewer(width,height);
  } else {
    this.setHidden((width == 0 || height == 0));
    this.getMap().updateSize();
    this.state.hidemaps.forEach((hidemap) => {
      hidemap.map.updateSize()
    });
    this._updateMapView();
    this._updateMapControlsLayout({width, height})
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

proto.setInnerGreyCoverBBox = function(options={}) {
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
  this.stopDrawGreyCover();
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
  const map = this.getMap();
  if (this._greyListenerKey) {
    ol.Observable.unByKey(this._greyListenerKey);
    this._greyListenerKey = null;
    if (this._drawShadow.inner.length) {
      this._resetDrawShadowInner();
    }
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
  const {name, crs, data, color, type} = externalLayer;
  const map = this.viewer.map;
  const catalogService = GUI.getComponent('catalog').getService();
  const QueryResultService = GUI.getComponent('queryresults').getService();
  const layer = this.getLayerByName(name);
  const loadExternalLayer = (format, data, epsg=crs) => {
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
          const data = JSON.stringify(geojson);
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
