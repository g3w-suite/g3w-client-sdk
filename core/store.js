const store = Vue.observable(
  {
    state: {
      ready: false,
      error: {
        message: null,

      }
    },
    map: {
      show: true,
      ready: false,
      layers: {},
      controls: {},
    },
    print: {
      loading: false
    },
    search: {
      loading: false
    },
    query: {
      loading: false
    },
    plugins: [],
    currentProject: null,
});

const methods = {
  getCurrentProject(){
    return store.currentProject;
  },
  setCurrentProject(project){
    store.currentProject = project;
  }
};


module.exports = {
  store,
  methods
};

