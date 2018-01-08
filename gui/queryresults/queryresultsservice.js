const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ProjectsRegistry = require('core/project/projectsregistry');
const Layer = require('core/layers/layer');
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const VectorLayer = require('core/layers/vectorlayer');
const ComponentsRegistry = require('gui/componentsregistry');
const PhotoComponent = require('./components/photo/vue/photo');
const RelationsPage = require('./components/relations/vue/relationspage');

function QueryResultsService() {
  // prendo le relazioni dal progetto e se ci sono e le raggruppo per referencedLayer
  this._relations = ProjectsRegistry.getCurrentProject().state.relations ? _.groupBy(ProjectsRegistry.getCurrentProject().state.relations,'referencedLayer'): null;
  this._actions = {
    'zoomto': QueryResultsService.zoomToElement,
    'highlightgeometry': QueryResultsService.highlightGeometry,
    'clearHighlightGeometry': QueryResultsService.clearHighlightGeometry
  };
  this.state = {};
  this.init = function() {
    this.clearState();
  };

  // array dei layers vettoriali
  this._vectorLayers = [];

  this.setters = {
    setQueryResponse: function(queryResponse, coordinates, resolution ) {
      this.clearState();
      this.state.query = queryResponse.query;
      //recupero tutti i mlayers dalll'attributo data della risposta
      // costuendo il formato digeribile dal componente query
      const layers = this._digestFeaturesForLayers(queryResponse.data);
      //setto i layers data
      this.setLayersData(layers);
    },
    setLayersData: function(layers) {
      // un opportunità per aggiungere / modificare i risultati dell'interrogazione
      this.state.loading = false;
      this.state.layers =  layers;
      this.setActionsForLayers(layers);
    },
    addActionsForLayers: function(actions) {
      // un opportunità per i listener per aggiungere azioni a layer e feature
    },
    postRender: function(element) {
      // un opportunità per i listener di intervenire sul DOM
    }
  };
  // fa il clear dello state
  this.clearState = function() {
    this.state.layers = [];
    this.state.query = {};
    this.state.querytitle = "";
    this.state.loading = true;
    this.state.layersactions = {};
  };

  this.getState = function() {
    return this.state;
  };

  this.setState = function(state) {
    this.state = state;
  };

  this.setTitle = function(querytitle) {
    this.state.querytitle = querytitle || "";
  };

  this.reset = function() {
    this.clearState();
  };

  this.getFieldType = function (layer, name, value) {
    let Fields = {};
    Fields.SIMPLE = 'simple';
    Fields.LINK = 'link';
    Fields.PHOTO = 'photo';
    Fields.PHOTOLINK = "photolink";
    Fields.IMAGE = 'image';
    Fields.POINTLINK = 'pointlink';
    Fields.ROUTE = 'route';

    const URLPattern = /^(https?:\/\/[^\s]+)/g;
    const PhotoPattern = /[^\s]+.(png|jpg|jpeg|gif)$/g;
    if (_.isNil(value)) {
      return Fields.SIMPLE;
    }
    value = value.toString();

    if (!value.match(URLPattern) && value.match(PhotoPattern)) {
      return Fields.PHOTO;
    }

    if (value.match(URLPattern) && !value.match(PhotoPattern)) {
      return Fields.LINK;
    }
    if (value.match(URLPattern) && value.match(PhotoPattern)) {
      return Fields.PHOTOLINK;
    }
    return Fields.SIMPLE;
  };
  this.fieldIs = function(TYPE,layer,attributeName,attributeValue) {
    const fieldType = this.getFieldType(layer,attributeName,attributeValue);
    return fieldType === TYPE;
  };
  // funzione che serve a far digerire i risultati delle features
  this._digestFeaturesForLayers = function(featuresForLayers) {
    let id = 0;
    // variabile che tiene traccia dei layer sotto query
    let layers = [];
    let layerAttributes,
      layerRelationsAttributes,
      layerTitle,
      layerId;
    featuresForLayers.forEach((featuresForLayer) => {
      featuresForLayer = featuresForLayer;
      // prendo il layer
      const layer = featuresForLayer.layer;
      // verifico che tipo ti vector layer ci sono
      if (layer instanceof Layer) {
        layerAttributes = layer.getAttributes();
        layerRelationsAttributes = [];//layer.getRelationsAttributes();
        layerTitle = layer.getTitle();
        layerId = layer.getId();
      }
      else if (layer instanceof ol.layer.Vector){
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
        hasImageField: false, // regola che mi permette di vedere se esiste un campo image
        relationsattributes: layerRelationsAttributes,
        error: ''
      };

      // verifico che ci siano feature legate a quel layer che sono il risultato della query
      if (featuresForLayer.features && featuresForLayer.features.length) {
        // prendo solo gli attributi effettivamente ritornati dal WMS (usando la prima feature disponibile)
        layerObj.attributes = this._parseAttributes(layerAttributes, featuresForLayer.features[0].getProperties());
        // faccio una ricerca sugli attributi del layer se esiste un campo image
        // se si lo setto a true
        layerObj.attributes.forEach((attribute) => {
          if (attribute.type == 'image') {
            layerObj.hasImageField = true;
          }
        });
        // a questo punto scorro sulle features selezionate dal risultato della query
        featuresForLayer.features.forEach((feature) => {
          const fid = feature.getId() ? feature.getId() : id;
          const geometry = feature.getGeometry();
          // verifico se il layer ha la geometria
          if (geometry) {
            // setto che ha geometria mi servirà per le action
            layerObj.hasgeometry = true
          }
          // creo un feature object
          const featureObj = {
            id: fid,
            attributes: feature.getProperties(),
            geometry: feature.getGeometry(),
            show: true
            // aggiungo le relazioni
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

  this._parseAttributes = function(layerAttributes, featureAttributes) {
    let featureAttributesNames = _.keys(featureAttributes);
    featureAttributesNames = _.filter(featureAttributesNames,function(featureAttributesName){
      return ['boundedBy','geom','the_geom','geometry','bbox', 'GEOMETRY'].indexOf(featureAttributesName) == -1;
    });
    if (layerAttributes && layerAttributes.length) {
      let featureAttributesNames = _.keys(featureAttributes);
      return _.filter(layerAttributes,function(attribute){
        return featureAttributesNames.indexOf(attribute.name) > -1;
      })
    }
    // se layer.attributes è vuoto
    // (es. quando l'interrogazione è verso un layer esterno di cui non so i campi)
    // costruisco la struttura "fittizia" usando l'attributo sia come name che come label
    else {
      return _.map(featureAttributesNames, function(featureAttributesName) {
        return {
          name: featureAttributesName,
          label: featureAttributesName
        }
      })
    }
  };

  // metodo per settare le azioni che si possono fare sulle feature del layer
  this.setActionsForLayers = function(layers) {
    // scorro su ogni layer che ho nella risposta
    layers.forEach((layer) => {
      // se non esistono azioni su uno specifico layer creo
      // array di azioni con chiave id del layer (in quanto valore univoco)
      if (!this.state.layersactions[layer.id]) {
        this.state.layersactions[layer.id] = [];
      }
      // verifico se il layer ha gemetria
      if (layer.hasgeometry) {
        // se prsente aggiungo oggetto azione che mi server per fare
        // il goTo geometry
        this.state.layersactions[layer.id].push({
          id: 'gotogeometry',
          class: 'glyphicon glyphicon-map-marker',
          hint: 'Visualizza sulla mappa',
          cbk: QueryResultsService.goToGeometry
        })
      }
      // vado a costruire l'action delle query-relazioni
      if (this._relations) {
        // scorro sulle relazioni e vado a verificare se ci sono relazioni che riguardano quel determintato layer
        Object.entries(this._relations).forEach(([id, relations]) => {
          // verifico se l'id del layer è uguale all'id della relazione
          if (layer.id == id) {
            this.state.layersactions[layer.id].push({
              id: 'show-query-relations',
              class: 'fa fa-sitemap',
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

  this.trigger = function(actionId, layer, feature) {
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

  this.triggerLayerAction = function(action,layer,feature) {
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

  //funzione che permette di vedere la foto a schermo intero
  this.showFullPhoto = function(url) {
    GUI.pushContent({
      content: new PhotoComponent({
        url: url
      }),
      backonclose: true,
      closable: false
    });
  };

  // funzione che mi serve per registrare il vector layer al fine di fare le query
  this.registerVectorLayer = function(vectorLayer) {
    if (this._vectorLayers.indexOf(vectorLayer) == -1) {
      //vado ad aggiungere informazioni utili alla visualizzazioni nel query
      vectorLayer.state = {};
      vectorLayer.state.title = vectorLayer.name;
      vectorLayer.state.id = vectorLayer.id;
      this._vectorLayers.push(vectorLayer);
    }
  };

  // funzione che mi serve per unregistrare il vector layer dalla query
  this.unregisterVectorLayer = function(vectorLayer) {
    const index = this._vectorLayers.indexOf(vectorLayer);
    if ( index != -1) {
      this._vectorLayers.splice(index, 1);
    }
  };

  // funzione che permette ai layer vettoriali di aggancirsi alla query info
  this._addVectorLayersDataToQueryResponse = function() {
    this.onbefore('setQueryResponse', (queryResponse, coordinates, resolution) => {
      var mapService = ComponentsRegistry.getComponent('map').getService();
      var isVisible = false;
      this._vectorLayers.forEach((vectorLayer) => {
        let features = [];
        let feature,
          intersectGeom;
        // la prima condizione mi server se viene fatto un setQueryResponse sul singolo layer vettoriale
        // ad esempio con un pickfeature per evitare che venga scatenato un'altra query
        // nel caso di attivazione di uno dei query control (la momento bbox, info e polygon)
        // la setQueryresponse ha priorità sugli altri di fatto cancellando la setResqponseqeusry dello specifico vectorLayer
        switch (vectorLayer.constructor) {
          case VectorLayer:
            isVisible = !vectorLayer.isVisible();
            break;
          case ol.layer.Vector:
            isVisible = !vectorLayer.getVisible();
            break;
        }
        if ((queryResponse.data && queryResponse.data.length && queryResponse.data[0].layer == vectorLayer) || !coordinates || isVisible ) { return true}
        // caso in cui è stato fatto una precedente richiesta identify e quindi devo attaccare il risultato
        // non mi piace perchè devo usare altro metodo
        // caso query info
        if (_.isArray(coordinates)) {
          if (coordinates.length == 2) {
            const pixel = mapService.viewer.map.getPixelFromCoordinate(coordinates);
            feature = mapService.viewer.map.forEachFeatureAtPixel(pixel, function (feature, layer) {
              return feature;
            },  {
              layerFilter: function(layer) {
                return layer === vectorLayer;
              }
            });
            if (feature) {
              features.push(feature);
            }
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
        // vado a pushare le features verificando prima se c'è stato un risultato
        queryResponse.data = queryResponse.data ? queryResponse.data : [];
        queryResponse.data.push({
          features: features,
          layer: vectorLayer
        });
      })
    });
  };

  base(this);
  // lancio subito la registrazione
  this._addVectorLayersDataToQueryResponse();
}

QueryResultsService.zoomToElement = function(layer,feature) {
  //TODO
};

QueryResultsService.goToGeometry = function(layer,feature) {
  if (feature.geometry) {
    const mapService = ComponentsRegistry.getComponent('map').getService();
    mapService.highlightGeometry(feature.geometry, {duration: 4000});
  }
};

QueryResultsService.highlightGeometry = function(layer,feature) {
  if (feature.geometry) {
    const mapService = ComponentsRegistry.getComponent('map').getService();
    mapService.highlightGeometry(feature.geometry,{zoom: false});
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

// Make the public service en Event Emitter
inherit(QueryResultsService, G3WObject);

module.exports = QueryResultsService;
