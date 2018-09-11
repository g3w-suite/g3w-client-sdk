const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ProjectsRegistry = require('core/project/projectsregistry');
const Layer = require('core/layers/layer');
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const VectorLayer = require('core/layers/vectorlayer');
const ComponentsRegistry = require('gui/componentsregistry');
const RelationsPage = require('./components/relations/vue/relationspage');

function QueryResultsService() {
  ProjectsRegistry.onafter('setCurrentProject', (project) => {
    this._setRelations(project);
  });
  this._actions = {
    'zoomto': QueryResultsService.zoomToElement,
    'highlightgeometry': QueryResultsService.highlightGeometry,
    'clearHighlightGeometry': QueryResultsService.clearHighlightGeometry
  };
  this._relations = [];
  const project = ProjectsRegistry.getCurrentProject();
  this.state = {
    components: []
  };
  this.init = function() {
    this.clearState();
  };

  this._vectorLayers = [];
  this.setters = {
    setQueryResponse: function(queryResponse, coordinates, resolution ) {
      this.clearState();
      this.state.query = queryResponse.query;
      const layers = this._digestFeaturesForLayers(queryResponse.data);
      this.setLayersData(layers);
    },
    setLayersData: function(layers) {
      this.state.loading = false;
      this.state.layers =  layers;
      this.setActionsForLayers(layers);
    },
    addComponent: function(component) {
      this._addComponent(component)
    },
    addActionsForLayers: function(actions) {},
    postRender: function(element) {},
    closeComponent: function() {}
  };
  base(this);
  this._setRelations(project);
  this._addVectorLayersDataToQueryResponse();
}

// Make the public service en Event Emitter
inherit(QueryResultsService, G3WObject);


const proto = QueryResultsService.prototype;

proto.clearState = function() {
  this.state.layers = [];
  this.state.query = {};
  this.state.querytitle = "";
  this.state.loading = true;
  this.state.layersactions = {};
};

proto.getState = function() {
  return this.state;
};

proto.setState = function(state) {
  this.state = state;
};

proto._setRelations = function(project) {
  const projectRelations = project.getRelations();
  this._relations = projectRelations ? _.groupBy(projectRelations,'referencedLayer'):  [];
};

proto.setTitle = function(querytitle) {
  this.state.querytitle = querytitle || "";
};

proto.reset = function() {
  this.clearState();
};

proto._digestFeaturesForLayers = function(featuresForLayers) {
  let id = 0;
  featuresForLayers = featuresForLayers || [];
  let layers = [];
  let layerAttributes,
    layerRelationsAttributes,
    layerTitle,
    layerId;
  let formStructure;
  featuresForLayers.forEach((featuresForLayer) => {
    const layer = featuresForLayer.layer;
    if (layer instanceof Layer) {
      layerAttributes = layer.getAttributes();
      layerRelationsAttributes = [];
      layerTitle = layer.getTitle();
      layerId = layer.getId();
      if (layer.hasFormStructure()) {
        const structure = layer.getEditorFormStructure();
        if (this._relations) {
          const getRelationFieldsFromFormStructure = (node) => {
            if (!node.nodes) {
              node.name ? node.relation = true : null;
            } else {
              for (const _node of node.nodes) {
                getRelationFieldsFromFormStructure(_node);
              }
            }
          };
          for (const node of structure) {
            getRelationFieldsFromFormStructure(node);
          }
        }
        let fields = layer.getFields();
        formStructure = {
          structure,
          fields
        }
      }
    } else if (layer instanceof ol.layer.Vector){
      layerAttributes = layer.getProperties();
      layerRelationsAttributes =  [];
      layerTitle = layer.get('name');
      layerId = layer.get('id');
    }

    const layerObj = {
      title: layerTitle,
      id: layerId,
      attributes: [],
      features: [],
      hasgeometry: false,
      show: true,
      expandable: true,
      hasImageField: false,
      relationsattributes: layerRelationsAttributes,
      formStructure,
      error: ''
    };

    if (featuresForLayer.features && featuresForLayer.features.length) {
      layerObj.attributes = this._parseAttributes(layerAttributes, featuresForLayer.features[0].getProperties());
      layerObj.attributes.forEach((attribute) => {
        if (attribute.type == 'image') {
          layerObj.hasImageField = true;
        }
      });
      featuresForLayer.features.forEach((feature) => {
        const fid = feature.getId() ? feature.getId() : id;
        const geometry = feature.getGeometry();
        if (geometry) {
          layerObj.hasgeometry = true
        }
        const featureObj = {
          id: fid,
          attributes: feature.getProperties(),
          geometry: feature.getGeometry(),
          show: true
        };
        layerObj.features.push(featureObj);
        id += 1;
      });
      layers.push(layerObj);
    }
    else if (featuresForLayer.error){
      layerObj.error = featuresForLayer.error;
    }
  });
  return layers;
};

proto._parseAttributes = function(layerAttributes, featureAttributes) {
  let featureAttributesNames = _.keys(featureAttributes);
  featureAttributesNames = _.filter(featureAttributesNames,function(featureAttributesName){
    return ['boundedBy','geom','the_geom','geometry','bbox', 'GEOMETRY'].indexOf(featureAttributesName) == -1;
  });
  if (layerAttributes && layerAttributes.length) {
    return _.filter(layerAttributes,function(attribute){
      return featureAttributesNames.indexOf(attribute.name) > -1;
    })
  } else {
    return _.map(featureAttributesNames, function(featureAttributesName) {
      return {
        name: featureAttributesName,
        label: featureAttributesName
      }
    })
  }
};

proto.setActionsForLayers = function(layers) {
  layers.forEach((layer) => {
    if (!this.state.layersactions[layer.id]) {
      this.state.layersactions[layer.id] = [];
    }
    if (layer.hasgeometry) {
      this.state.layersactions[layer.id].push({
        id: 'gotogeometry',
        class: GUI.getFontClass('marker'),
        hint: 'Visualizza sulla mappa',
        cbk: QueryResultsService.goToGeometry
      })
    }
    if (this._relations) {
      Object.entries(this._relations).forEach(([id, relations]) => {
        if (layer.id == id) {
          this.state.layersactions[layer.id].push({
            id: 'show-query-relations',
            class: GUI.getFontClass('relation'),
            hint: 'Visualizza Relazioni',
            cbk: QueryResultsService.showQueryRelations,
            relations: relations
          });
          return false;
        }
      })
    }
  });
  this.addActionsForLayers(this.state.layersactions);
};

proto.trigger = function(actionId, layer, feature) {
  const actionMethod = this._actions[actionId];
  if (actionMethod) {
    actionMethod(layer, feature);
  }
  if (layer) {
    const layerActions = this.state.layersactions[layer.id];
    if (layerActions) {
      let action;
      layerActions.forEach((layerAction) => {
        if (layerAction.id == actionId) {
          action = layerAction;
        }
      });
      if (action) {
        this.triggerLayerAction(action,layer,feature);
      }
    }
  }
};

proto.triggerLayerAction = function(action,layer,feature) {
  if (action.cbk) {
    action.cbk(layer,feature, action)
  }
  if (action.route) {
    let url;
    let urlTemplate = action.route;
    url = urlTemplate.replace(/{(\w*)}/g,function(m,key){
      return feature.attributes.hasOwnProperty(key) ? feature.attributes[key] : "";
    });
    if (url && url != '') {
      GUI.goto(url);
    }
  }
};

proto.registerVectorLayer = function(vectorLayer) {
  if (this._vectorLayers.indexOf(vectorLayer) == -1) {
    this._vectorLayers.push(vectorLayer);
  }
};

proto.unregisterVectorLayer = function(vectorLayer) {
  const index = this._vectorLayers.indexOf(vectorLayer);
  if ( index != -1) {
    this._vectorLayers.splice(index, 1);
  }
};

proto._addVectorLayersDataToQueryResponse = function() {
  this.onbefore('setQueryResponse', (queryResponse, coordinates, resolution) => {
    const mapService = ComponentsRegistry.getComponent('map').getService();
    let isVisible = false;
    this._vectorLayers.forEach((vectorLayer) => {
      let features = [];
      let feature,
        intersectGeom;
      switch (vectorLayer.constructor) {
        case VectorLayer:
          isVisible = !vectorLayer.isVisible();
          break;
        case ol.layer.Vector:
          isVisible = !vectorLayer.getVisible();
          break;
      }
      if ((queryResponse.data && queryResponse.data.length && queryResponse.data[0].layer == vectorLayer) || !coordinates || isVisible ) { return true}
      if (_.isArray(coordinates)) {
        if (coordinates.length == 2) {
          const pixel = mapService.viewer.map.getPixelFromCoordinate(coordinates);
          mapService.viewer.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
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
      queryResponse.data = queryResponse.data ? queryResponse.data : [];
      queryResponse.data.push({
        features: features,
        layer: vectorLayer
      });
    })
  });
};

//function to add c custom componet in query result
proto._addComponent = function(component) {
  this.state.components.push(component)
};

QueryResultsService.zoomToElement = function(layer, feature) {
  //TODO
};

QueryResultsService.goToGeometry = function(layer, feature) {
  //mobile
  isMobile.any && !GUI.isContentCollapsed()? GUI.collapseContent() : null;
  //
  if (feature.geometry) {
    const mapService = ComponentsRegistry.getComponent('map').getService();
    mapService.highlightGeometry(feature.geometry, {
      layerId: layer.id,
      duration: 1500
    });
  }
};

QueryResultsService.highlightGeometry = function(layer, feature) {
  if (feature.geometry) {
    const mapService = ComponentsRegistry.getComponent('map').getService();
    mapService.highlightGeometry(feature.geometry, {
      layerId: layer.id,
      zoom: false
    });
  }
};

QueryResultsService.clearHighlightGeometry = function(layer, feature) {
  const mapService = ComponentsRegistry.getComponent('map').getService();
  mapService.clearHighlightGeometry();
};

QueryResultsService.showQueryRelations = function(layer, feature, action) {
  GUI.pushContent({
    content: new RelationsPage({
      relations: action.relations,
      feature: feature
    }),
    backonclose: true,
    closable: false
  });
};

module.exports = QueryResultsService;


