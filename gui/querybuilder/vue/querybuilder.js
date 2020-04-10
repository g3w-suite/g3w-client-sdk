import Service from "../service";
import OPERATORS from 'core/layers/filter/operators';
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
      loading: false
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
  methods: {
    addToExpression({value, type}={}){
      switch(type) {
        case 'operator':
          value = ` ${value} `;
          break;
        case 'field':
          value = `"${value}"`;
          break;
        case 'value':
          value = `'${value}'`;
          break;
      }
      this.filter = (`${this.filter}${value}`);
    },
    reset(){
      this.filter = '';
      this.message = '';
    },
    async test() {
      const layerId = this.currentlayer.id;
      this.loading = true;
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
      this.loading = false;
      await this.$nextTick();

    },
    async run(){
      const layerId = this.currentlayer.id;
      this.loading = true;
      try {
        const response = await Service.run({
          layerId,
          filter: this.filter
        });
      } catch(err){}
      this.loading = false;
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
    const project = ProjectsRegistry.getCurrentProject();
    this.projectId = project.getId();
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
      });
    });
  }
});

module.exports = QueryBuilder;
