var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var QueryResultsService = require('gui/queryresults/queryresultsservice');
var ProjectsRegistry = require('core/project/projectsregistry');

Fields = {};
Fields.SIMPLE = 'simple';
Fields.LINK = 'link';
Fields.PHOTO = 'photo';
Fields.POINTLINK = 'pointlink';
Fields.ROUTE = 'route';

function getFieldType(layer, name, value) {

  var URLPattern = /^(https?:\/\/[^\s]+)/g;
  var PhotoPattern = /[^\s]+.(png|jpg|jpeg)$/g;
  if (_.isNil(value)) {
    return Fields.SIMPLE;
  }
  value = value.toString();

  var extension = value.split('.').pop();
  if (value.match(PhotoPattern)) {
    return Fields.PHOTO;
  }

  if (value.match(URLPattern)) {
    return Fields.LINK;
  }

  return Fields.SIMPLE;
}

function fieldIs(TYPE,layer,attributeName,attributeValue) {
  var fieldType = getFieldType(layer,attributeName,attributeValue);
  return fieldType === TYPE;
}

var maxSubsetLength = 3;
var headerExpandActionCellWidth = 10;
var headerActionsCellWidth = 10;

var vueComponentOptions = {
  template: require('./queryresults.html'),
  data: function() {
    return {
      state: this.$options.queryResultsService.state,
      layersFeaturesBoxes: {},
      headerExpandActionCellWidth: headerExpandActionCellWidth,
      headerActionsCellWidth: headerActionsCellWidth
    }
  },
  methods: {
    isSimple: function(layer,attributeName,attributeValue) {
      return fieldIs(Fields.SIMPLE,layer,attributeName,attributeValue);
    },
    isLink: function(layer,attributeName,attributeValue) {
      return fieldIs(Fields.LINK,layer,attributeName,attributeValue);
    },
    is: function(type,layer,attributeName,attributeValue) {
      return fieldIs(type,layer,attributeName,attributeValue);
    },
    isRelativePath: function(url) {
      if (!_.startsWith(url,'/')) {
        return ProjectsRegistry.getConfig().mediaurl + url
      }
      return url
    },
    layerHasFeatures: function(layer) {
      if (layer.features) {
        return layer.features.length > 0;
      }
      return false;
    },
    hasResults: function() {
      return this.state.layers.length;
    },
    layerHasActions: function(layer) {
      return this.state.layersactions[layer.id].length > 0;
    },
    featureHasActions: function(layer,feature) {
      return this.geometryAvailable(feature);
    },
    /*getLayerActions: function(layer) {
     return this.$options.queryResultsService.getLayerActions(layer);
     },*/
    geometryAvailable: function(feature) {
      return feature.geometry ? true : false;
    },
    attributesSubset: function(attributes) {
      // faccio un filtro sul campo immagine perchè non ha senso far vedere
      // la stringa con il path dell'immagine
      var attributes = _.filter(attributes, function(attribute) {
        return attribute.type != 'image';
      });
      var end = Math.min(maxSubsetLength, attributes.length);
      return attributes.slice(0, end);
    },
    relationsAttributesSubset: function(relationAttributes) {
      var attributes = [];
      _.forEach(relationAttributes, function (value, attribute) {
        attributes.push({label: attribute, value: value})
      });
      var end = Math.min(maxSubsetLength, attributes.length);
      return attributes.slice(0, end);
    },
    relationsAttributes: function(relationAttributes) {
      var attributes = [];
      _.forEach(relationAttributes, function (value, attribute) {
        attributes.push({label: attribute, value: value})
      });
      return attributes;
    },
    attributesSubsetLength: function(attributes) {
      return this.attributesSubset(attributes).length;
    },
    cellWidth: function(index,layer) {
      var subsetLength = this.attributesSubsetLength(layer.attributes);
      var diff = maxSubsetLength - subsetLength;
      actionsCellWidth = layer.hasgeometry ? headerActionsCellWidth : 0;
      var headerAttributeCellTotalWidth = 100 - headerExpandActionCellWidth - actionsCellWidth;
      var baseCellWidth = headerAttributeCellTotalWidth / maxSubsetLength;
      if ((index == subsetLength-1) && diff>0) {
        return baseCellWidth * (diff+1);
      }
      else {
        return baseCellWidth;
      }
    },
    featureBoxColspan: function(layer) {
      var colspan = this.attributesSubsetLength(layer.attributes);
      if (layer.expandable) {
        colspan += 1;
      }
      if (layer.hasgeometry) {
        colspan += 1;
      }
      return colspan;
    },
    relationsAttributesSubsetLength: function(elements) {
      return this.relationsAttributesSubset(elements).length;
    },
    collapsedFeatureBox: function(layer, feature, relation_index) {
      var collapsed = true;
      var boxid;
      if (!_.isNil(relation_index)) {
        boxid = layer.id + '_' + feature.id+ '_' + relation_index;
      } else {
        boxid = layer.id + '_' + feature.id;
      }
      if (this.layersFeaturesBoxes[boxid]) {
        collapsed = this.layersFeaturesBoxes[boxid].collapsed;
      }
      return collapsed;
    },
    toggleFeatureBox: function(layer, feature, relation_index) {
      var boxid;
      if (!_.isNil(relation_index)) {
        boxid = layer.id + '_' + feature.id+ '_' + relation_index;
      } else {
        boxid = layer.id + '_' + feature.id;
      }
      this.layersFeaturesBoxes[boxid].collapsed = !this.layersFeaturesBoxes[boxid].collapsed;
    },
    toggleFeatureBoxAndZoom: function(layer, feature, relation_index) {
      // Disattivo zoom to sul toggle della featurebox. Casomai lo ripristineremo quando sarà gestito tramite qualche setting
      /*if (this.collapsedFeatureBox(layer, feature, relation_index)) {
       this.trigger('gotogeometry',layer,feature)
       }*/
      this.toggleFeatureBox(layer, feature, relation_index);
    },
    trigger: function(action,layer,feature) {
      this.$options.queryResultsService.trigger(action,layer,feature);
    },
    showFullPhoto: function(url) {
      this.$options.queryResultsService.showFullPhoto(url);
    }
  },
  watch: {
    // i listeners del queryResultsService.postRender
    // potrebbero avere bisogno di modificare il DOM dopo che sono cambiati
    // (per qualsiasi motivo) i dati e quindi Vue rirenderizza il DOM
    'state.layers': function(layers) {
      var self = this;
      if (layers.length) {
        this.$nextTick(function() {
          self.$options.queryResultsService.postRender(self.$el);
        })
      }
    }
  }
};

// se lo voglio istanziare manualmente
var InternalComponent = Vue.extend(vueComponentOptions);

function QueryResultsComponent(options) {
  base(this, options);
  var self = this;
  this.id = "queryresults";
  this.title = "Query Results";
  this._service = new QueryResultsService();
  //usato quando è stato distrutto
  this.setInternalComponent = function() {
    this.internalComponent = new InternalComponent({
      queryResultsService: this._service
    });
    this.createLayersFeaturesBoxes();
    this.internalComponent.querytitle = this._service.state.querytitle;
  };

  this.getElement = function() {
    if (this.internalComponent) {
      return this.internalComponent.$el;
    }
  };

  this._service.onafter('setLayersData',function() {
    if (!self.internalComponent) {
      self.setInternalComponent();
    }
    self.createLayersFeaturesBoxes();
  });

  merge(this, options);

  this.createLayersFeaturesBoxes = function() {
    var layersFeaturesBoxes = {};
    var layers = this._service.state.layers;
    _.forEach(layers, function(layer) {
      if (layer.attributes.length <= maxSubsetLength && !layer.hasImageField) {
        layer.expandable = false;
      }
      _.forEach(layer.features, function(feature, index) {
        // se è la prima feature e il layer ha più di maxSubsetLength attributi, allora la espando già in apertura
        //var collapsed = (index == 0 && layer.attributes.length > maxSubsetLength) ? false : true;
        var collapsed = true;
        var boxid = layer.id+'_'+feature.id;
        layersFeaturesBoxes[boxid] = {
          collapsed: collapsed
        };
        if (feature.attributes.relations) {
          boxid = '';
          _.forEach(feature.attributes.relations, function(relation) {
            boxid = layer.id + '_' + feature.id + '_' + relation.name;
            _.forEach(relation.elements, function(element, index){
              layersFeaturesBoxes[boxid+index] = {
                collapsed: true
              };
            });
          })
        }
      })
    });
    this.internalComponent.layersFeaturesBoxes = layersFeaturesBoxes;
  };
  // sovracrive il metodo pader mount del component
  /*this.mount = function(parent, append) {
    var self = this;
    // richiama il mont padre
    return base(this, 'mount', parent, append)
  };*/

  this.layout = function(width,height) {
    //TODO
  }
}
inherit(QueryResultsComponent, Component);

module.exports = QueryResultsComponent;