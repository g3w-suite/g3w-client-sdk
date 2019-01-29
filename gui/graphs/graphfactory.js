const Graphfactory = {
  GRAPHS: {
    line: require('./vue/line/line')
  },
  build({type, hooks} = {}) {
    const graphVue = this.GRAPHS[type];
    return Object.assign(hooks, graphVue);
  }
};


module.exports = Graphfactory;
