import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    project: {},
    editing: {},
    map: {
      controls: {},
      layers: {
        base: {},
        spatial: {
          wms: {},
          wfs: {},
          vector: {}
        },
        table: {}
      }
    },
    catalog: {},
    print: {},
    query: {},
    search: {},
    metadata: {},
    errors: {}
  },
  mutations: {},
  actions: {},
  getters: {},
});


export default store;

