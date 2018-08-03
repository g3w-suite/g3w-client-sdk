const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const Service = require('../relationsservice');

/* List of relaations */
const relationsComponent = {
  template: require('./relations.html'),
  props: ['relations', 'feature'],
  methods: {
    showRelation: function(relation) {
      this.$parent.showRelation(relation);
    },
    featureInfo: function() {
      let infoFeatures = [];
      let index = 0;
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

/* Relation Table */
const relationComponent = {
  template: require('./relation.html'),
  props: ['table', 'relation'],
  computed: {
    one() {
      return this.relation.type == 'ONE'
    }
  },
  methods: {
    back: function() {
      this.$parent.setRelationsList();
    },
    getFieldType: function (value) {
      const Fields = {};
      Fields.SIMPLE = 'simple';
      Fields.LINK = 'link';

      const URLPattern = /^(https?:\/\/[^\s]+)/g;
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
      const fieldType = this.getFieldType(value);
      return fieldType === type;
    },
    is: function(type,value) {
      return this.fieldIs(type, value);
    }
  },
  mounted () {
    this.relation.title = this.relation.name;
    this.$nextTick(() => {
      if (!this.one) {
        const tableHeight = $(".content").height();
        $('#relationtable').DataTable( {
          "pageLength": 10,
          "bLengthChange": false,
          "scrollY": tableHeight / 2 +  "px",
          "scrollCollapse": true,
          "order": [ 0, 'asc' ]
        } )
      }
    })
  }
};
/*-----------------------------------*/

const InternalComponent = Vue.extend({
  template: require('./relationspage.html'),
  data: function() {
    return {
      state: null,
      table: null,
      relation: null,
      relations: this.$options.relations,
      feature: this.$options.feature,
      currentview: 'relations'
    }
  },
  components: {
    'relations': relationsComponent,
    'relation': relationComponent
  },
  methods: {
    isOneRelation() {
      return this.relations.length == 1 && this.relations[0].type == 'ONE'
    },
    showRelation: function(relation) {
      this.relation = relation;
      const field = relation.fieldRef.referencedField;
      const value = this.feature.attributes[field];
      this.$options.service.getRelations({
        id: relation.id,
        value: value
      }).then((relations) => {
        this.table = this.$options.service.buildRelationTable(relations);
        this.currentview = 'relation';
        Vue.nextTick(() => {
          $(".query-relations .nano").nanoScroller();
        })
      }).fail((err) => {
        console.log(err)
      })
    },
    setRelationsList: function() {
      this.currentview = 'relations';
    }
  },
  beforeMount () {
    if (this.isOneRelation()) {
      this.showRelation(this.relations[0])
    }
  }
});

const RelationsPage = function(options) {
  base(this);
  options = options || {};
  const service = options.service || new Service({});
  const relations = options.relations || [];
  const feature = options.feature || null;
  this.setService(service);
  const internalComponent = new InternalComponent({
    service: service,
    relations: relations,
    feature: feature
  });
  this.setInternalComponent(internalComponent);
  internalComponent.state = service.state;
};
inherit(RelationsPage, Component);


module.exports = RelationsPage;


