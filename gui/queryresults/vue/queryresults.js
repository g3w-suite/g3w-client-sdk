const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const merge = require('core/utils/utils').merge;
const Component = require('gui/vue/component');
const QueryResultsService = require('gui/queryresults/queryresultsservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const t = require('core/i18n/i18n.service').t;

const maxSubsetLength = 3;
const headerExpandActionCellWidth = 10;
const headerActionsCellWidth = 10;

const vueComponentOptions = {
  template: require('./queryresults.html'),
  data: function() {
    return {
      state: this.$options.queryResultsService.state,
      layersFeaturesBoxes: {},
      headerExpandActionCellWidth: headerExpandActionCellWidth,
      headerActionsCellWidth: headerActionsCellWidth,
      noresultmessage: t("info.no_results"),
      openlink: t("info.open_link")
    }
  },
  computed: {
    hasResults: function() {
      return !!this.state.layers.length;
    }
  },
  methods: {
    isArray: function (value) {
      return _.isArray(value);
    },
    isSimple: function(layer,attributeName,attributeValue) {
      return !this.isArray(attributeValue) && this.fieldIs(Fields.SIMPLE,layer,attributeName,attributeValue);
    },
    isLink: function(layer,attributeName,attributeValue) {
      return this.fieldIs(Fields.LINK,layer,attributeName,attributeValue);
    },
    is: function(type,layer,attributeName,attributeValue) {
      return this.fieldIs(type,layer,attributeName,attributeValue);
    },
    checkField: function(type, fieldname, attributes) {
      var isType = false;
      _.forEach(attributes, function(attribute) {
        if (attribute.name == fieldname) {
          isType = attribute.type == type;
        }
      });

      return isType;
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
        if (_.isArray(value)) return;
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
    },
    openLink: function(link_url) {
      window.open(link_url, '_blank');
    },
    getFieldType: function (layer, name, value) {
      return this.$options.queryResultsService.getFieldType(layer, name, value);
    },
    fieldIs: function(TYPE,layer,attributeName,attributeValue) {
      return this.$options.queryResultsService.fieldIs(TYPE,layer,attributeName,attributeValue);
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
  },
  mounted: function() {
    Vue.nextTick(function() {
      // vado a settare i tooltip
      $('[data-toggle="tooltip"]').tooltip();
    })
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
      //da rivedere meglio
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
