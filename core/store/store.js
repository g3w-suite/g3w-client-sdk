// required for Edge
require('es6-promise').polyfill();
import Vuex from 'vuex';

Vue.use(Vuex);

const Store = new Vuex.Store({
  state: {
    gui: {
      map: {
        show: true
      },
      content: {
        show: false
      }
    },
    template: {},
    plugins: {}
  },
  mutations: {
    showMap: (state, show) => {
      state.gui.map.show = show;
    },
    showContent: (state, show) => {
      state.gui.content.show = show;
    },
    addPlugin: (state, options={}) => {
      const name = options.name;
      const plugin = options.plugin;
      if(name && plugin)
        state.plugins[name] = plugin;
      else
        throw new Error("Store 'addPlugin' mutation: No name or plugin provided")
    }
  },
  actions: {},
  getters: {
    mapShow: (state) => {
      return state.gui.map.show;
    },
    contentShow: (state) => {
      return state.gui.content.show;
    }
  },
});

export default Store;

