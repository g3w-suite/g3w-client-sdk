var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Component = require('gui/vue/component');
var Service = require('../relationsservice');



/* Lista delle relationi associate  */
var relationsComponent = {
  template: require('./relations.html'),
  props: ['relations', 'feature'],
  methods: {
    showRelation: function(relation) {
      this.$parent.showRelation(relation);
    },
    featureInfo: function() {
      var infoFeatures = [];
      var index = 0;
      _.forEach(this.feature.attributes, function(value, key) {
        if (index > 2) return false;
        if (value && _.isString(value) && value.indexOf('/') == -1 ) {
          infoFeatures.push({
            key: key,
            value: value
          });
          index+=1;
        }

      });
      return infoFeatures
    }
  }
};
/*-----------------------------------*/

/* Tabella relation */
var relationComponent = {
  template: require('./relation.html'),
  props: ['table', 'relation'],
  methods: {
    back: function() {
      this.$parent.setRelationsList();
    },
    getFieldType: function (value) {
      var Fields = {};
      Fields.SIMPLE = 'simple';
      Fields.LINK = 'link';

      var URLPattern = /^(https?:\/\/[^\s]+)/g;
      if (_.isNil(value)) {
        return Fields.SIMPLE;
      }
      value = value.toString();

      if (value.match(URLPattern)) {
        return Fields.LINK;
      }

      return Fields.SIMPLE;
    },
    fieldIs: function(type, value) {
      var fieldType = this.getFieldType(value);
      return fieldType === type;
    },
    is: function(type,value) {
      return this.fieldIs(type, value);
    }
  }
};
/*-----------------------------------*/

var InternalComponent = Vue.extend({
  template: require('./relationspage.html'),
  data: function() {
    return {
      state: null,
      table: null,
      relation: null,
      relations: this.$options.relations,
      feature: this.$options.feature,
      currentview: 'relations' // proprietà che serve per switchare tra componenti
    }
  },
  components: {
    'relations': relationsComponent,
    'relation': relationComponent
  },
  methods: {
    showRelation: function(relation) {
      var self = this;
      this.relation = relation;
      var field = relation.fieldRef.referencedField;
      var value = this.feature.attributes[field];
      this.$options.service.getRelations({
        id: relation.id,
        value: value
      }).then(function(relations) {
        self.table = self.$options.service.buildRelationTable(relations);
        self.currentview = 'relation';
        Vue.nextTick(function() {
          $(".nano").nanoScroller();
        })
      })
    },
    setRelationsList: function() {
      this.currentview = 'relations';
    }
  }
});

var RelationsPage = function(options) {
  base(this);
  var options = options || {};
  var service = options.service || new Service({});
  var relations = options.relations || [];
  var feature = options.feature || null;
  // istanzio il componente interno
  this.setService(service);
  // istanzio il componente interno
  var internalComponent = new InternalComponent({
    service: service,
    relations: relations,
    feature: feature
  });
  this.setInternalComponent(internalComponent);
  internalComponent.state = service.state;
};
inherit(RelationsPage, Component);


module.exports = RelationsPage;


