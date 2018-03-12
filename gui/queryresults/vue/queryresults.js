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
      hasResults: false,
      headerExpandActionCellWidth: headerExpandActionCellWidth,
      headerActionsCellWidth: headerActionsCellWidth,
      noresultmessage: t("info.no_results"),
      openlink: t("info.open_link")
    }
  },
  computed: {
    hasLayers: function() {
      return !!this.state.layers.length || !!this.state.components.length;
    }
  },
  methods: {
    showResults() {
      this.hasResults = true;
    },
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
      let isType = false;
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
      const _attributes = _.filter(attributes, function(attribute) {
        return attribute.type != 'image';
      });
      const end = Math.min(maxSubsetLength, attributes.length);
      return _attributes.slice(0, end);
    },
    relationsAttributesSubset: function(relationAttributes) {
      const attributes = [];
      _.forEach(relationAttributes, function (value, attribute) {
        if (_.isArray(value)) return;
        attributes.push({label: attribute, value: value})
      });
      const end = Math.min(maxSubsetLength, attributes.length);
      return attributes.slice(0, end);
    },
    relationsAttributes: function(relationAttributes) {
      const attributes = [];
      _.forEach(relationAttributes, function (value, attribute) {
        attributes.push({label: attribute, value: value})
      });
      return attributes;
    },
    attributesSubsetLength: function(attributes) {
      return this.attributesSubset(attributes).length;
    },
    cellWidth: function(index,layer) {
      const headerLength = maxSubsetLength + this.state.layersactions[layer.id].length;
      const subsetLength = this.attributesSubsetLength(layer.attributes);
      const diff = headerLength - subsetLength;
      actionsCellWidth = layer.hasgeometry ? headerActionsCellWidth : 0;
      const headerAttributeCellTotalWidth = 100 - headerExpandActionCellWidth - actionsCellWidth;
      const baseCellWidth = headerAttributeCellTotalWidth / maxSubsetLength;
      if ((index == subsetLength-1) && diff>0) {
        return baseCellWidth * (diff+1);
      }
      else {
        return baseCellWidth;
      }
    },
    featureBoxColspan: function(layer) {
      let colspan = this.attributesSubsetLength(layer.attributes);
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
      let collapsed = true;
      let boxid;
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
      let boxid;
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
    'state.layers': function(layers) {
      if (layers.length) {
        this.hasResults = true;
        this.$nextTick(() => {
          this.$options.queryResultsService.postRender(this.$el);
        })
      }
    }
  },
  mounted: function() {
    Vue.nextTick(() => {
      $('[data-toggle="tooltip"]').tooltip();
    })
  }
};

const InternalComponent = Vue.extend(vueComponentOptions);

function QueryResultsComponent(options) {
  base(this, options);
  this.id = "queryresults";
  this.title = "Query Results";
  this._service = new QueryResultsService();
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

  this._service.onafter('setLayersData', () => {
    if (!this.internalComponent) {
      this.setInternalComponent();
    }
    this.createLayersFeaturesBoxes();
  });

  merge(this, options);

  this.createLayersFeaturesBoxes = function() {
    const layersFeaturesBoxes = {};
    const layers = this._service.state.layers;
    layers.forEach((layer) => {
      if (layer.attributes.length <= maxSubsetLength && !layer.hasImageField) {
        layer.expandable = false;
      }
      layer.features.forEach((feature, index) => {
        let collapsed = true;
        let boxid = layer.id+'_'+feature.id;
        layersFeaturesBoxes[boxid] = {
          collapsed: collapsed
        };
        if (feature.attributes.relations) {
          boxid = '';
          const relations = feature.attributes.relations;
          relations.forEach((relation) => {
            boxid = layer.id + '_' + feature.id + '_' + relation.name;
            const elements = relation.elements;
            elements.forEach((element, index) =>{
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

  this.layout = function(width,height) {
    //TODO
  };
  this.unmount = function() {
    this.getService().closeComponent();
    return base(this, 'unmount')
  }
}
inherit(QueryResultsComponent, Component);

module.exports = QueryResultsComponent;
