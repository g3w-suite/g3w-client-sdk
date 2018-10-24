const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Component = require('gui/vue/component');
const Service = require('../relationsservice');
const Field = require('gui/fields/g3w-field.vue');
const RelationPageEventBus = new Vue();


/* List of relations */
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
let relationDataTable;
/* Relation Table */
const relationComponent = {
  template: require('./relation.html'),
  props: ['table', 'relation', 'previousview'],
  components: {
    Field
  },
  computed: {
    showrelationslist() {
      return this.previousview === 'relations'
    },
    one() {
      return this.relation.type == 'ONE'
    }
  },
  methods: {
    reloadLayout() {
      relationDataTable.columns.adjust();
    },
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
  created() {
    RelationPageEventBus.$on('reload', () => {
      this.reloadLayout();
    })
  },
  mounted () {
    this.relation.title = this.relation.name;
    this.$nextTick(() => {
      if (!this.one) {
        const tableHeight = $(".content").height();
        relationDataTable = $('#relationtable').DataTable( {
          "pageLength": 10,
          "bLengthChange": false,
          "scrollY": tableHeight / 2 +  "px",
          "scrollCollapse": true,
          "scrollX": true,
          "responsive": true,
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
      table: this.$options.table ? this.$options.service.buildRelationTable(this.$options.table) : null,
      relation: this.$options.relation || null,
      relations: this.$options.relations,
      feature: this.$options.feature,
      currentview: this.$options.currentview,
      previousview: this.$options.currentview
    }
  },
  components: {
    'relations': relationsComponent,
    'relation': relationComponent
  },
  methods: {
    reloadLayout() {
      RelationPageEventBus.$emit('reload');
    },
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
        this.previousview = 'relations';
        Vue.nextTick(() => {
          $(".query-relations .nano").nanoScroller();
        })
      }).fail((err) => {
        console.log(err)
      })
    },
    setRelationsList: function() {
      this.previousview = 'relation';
      this.currentview = 'relations';
    }
  },
  beforeMount () {
    if (this.isOneRelation()) {
      this.showRelation(this.relations[0])
    }
  }
});

const RelationsPage = function(options={}) {
  base(this);
  const service = options.service || new Service({});
  const relations = options.relations || [];
  const relation = options.relation || null;
  const feature = options.feature || null;
  const table = options.table || null;
  const currentview = options.currentview || 'relations';
  this.setService(service);
  const internalComponent = new InternalComponent({
    previousview: currentview,
    service: service,
    relations: relations,
    relation,
    feature: feature,
    currentview,
    table
  });
  this.setInternalComponent(internalComponent);
  internalComponent.state = service.state;
  this.layout = function() {
    internalComponent.reloadLayout();
  };
};

inherit(RelationsPage, Component);

const proto = RelationsPage.prototype;

module.exports = RelationsPage;


