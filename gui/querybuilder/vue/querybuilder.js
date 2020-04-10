import Service from "../service";
import {OPERATORS} from 'core/layers/filter/operators';
const templateCompiled = Vue.compile(require('./querybuilder.html'));
const ProjectsRegistry = require('core/project/projectsregistry');
const operators = Object.values(OPERATORS);

const QueryBuilder = Vue.extend({
  ...templateCompiled,
  data() {
    return {
      currentlayer: null,
      message: '',
      filter: '',
      loading: {
        test: false,
        values: false
      },
      values: [],
      manual: true,
      manualvalue: null,
      select: {
        field: null,
        value: null
      }
    }
  },
  computed:{
    fields() {
      return this.currentlayer ? this.currentlayer.fields : [];
    },
    disabled() {
      return !this.filter;
    }
  },
  watch: {
    'select.field'(){
      this.values = [];
      this.manual = true;
    }
  },
  methods: {
    addToExpression({value, type}={}){
      switch(type) {
        case 'operator':
          if (this.filterElement.current === 'field' || this.filterElement.current === 'value') {
            if (this.filterElement.current === 'value' && ['AND', 'OR'].indexOf(value) === -1)
              value = null;
            else {
              this.filterElement.previous = this.filterElement.current;
              this.filterElement.current = type;
              this.filterElement.operator = value;
              value = ` ${value} `;
            }
          } else value = null;
          break;
        case 'field':
          if (this.filterElement.current === null ||
            (this.filterElement.current === 'operator' && ['AND', 'OR'].indexOf(this.filterElement.operator) !== -1 && this.filterElement.previous === 'value')) {
            value = `"${value}"`;
            this.filterElement.previous = this.filterElement.current;
            this.filterElement.current = type;
          } else value = null;
          break;
        case 'value':
          if (this.filterElement.current === 'operator') {
            value = `'${value}'`;
            this.filterElement.previous = this.filterElement.current;
            this.filterElement.current = type;
          } else value = null;
          break;
      }
      if (value) this.filter = (`${this.filter}${value}`);
    },
    async all(){
      this.loading.values = true;
      try {
        this.values = await Service.getValues({
          layerId: this.currentlayer.id,
          field: this.select.field
        });

      } catch(err){

      }
      this.loading.values = false;
      await this.$nextTick();
      this.manualvalue = null;
      this.manual = false;
    },
    reset(){
      this.filter = '';
      this.message = '';
      this.filterElement.previous = null;
      this.filterElement.current = null;
      this.filterElement.operator =null;
    },
    async test() {
      const layerId = this.currentlayer.id;
      this.loading.test = true;
      let number_of_features;
      try {
        number_of_features = await Service.test({
          layerId,
          filter: this.filter
        });
        this.message = number_of_features !== undefined ? `numero di features ${number_of_features}` : ''
      } catch(err){
        this.message = err;
      }
      this.loading.test = false;
      await this.$nextTick();

    },
    async run(){
      const layerId = this.currentlayer.id;
      this.loading.test = true;
      try {
        const response = await Service.run({
          layerId,
          filter: this.filter
        });
      } catch(err){}
      this.loading.test = false;
    },
    save() {
      Service.save({
        layerId: this.currentlayer.id,
        filter: this.filter,
        projectId: this.projectId
      })
    }
  },
  created() {
    this.filterElement = {
      current: null,
      previous: null,
      operator: null
    };
    const project = ProjectsRegistry.getCurrentProject();
    this.layers = project.getLayers().filter(layer => {
      return !layer.baseLayer && Array.isArray(layer.fields);
    }).map(layer => {
      return {
        id: layer.id,
        label: layer.name,
        fields: layer.fields.map(field => field.name)
      }
    });
    this.operators = operators;
    this.currentlayer = this.layers[0];
  },
  mounted(){
    this.$nextTick(()=>{
      this.select2 = $('#query_builder_layers_select').select2({
        width: '100%',
      });
      this.select2.on('select2:select', (evt) => {
        this.currentlayer = this.layers[evt.params.data.id];
        this.select.field = null;
        this.select.value = null;
        this.reset();
      });
    });
  },
  beforeDestroy(){
    this.select2.destroy();
    this.select2 = null;
  }
});

module.exports = QueryBuilder;
