const Component = require('./vue/component');
const ComponentsFactory = {
  build({vueComponentObject, service}) {
    const component = new Component();
    component.init({
      vueComponentObject,
      service
    });
    return component
  }
};

module.exports = ComponentsFactory;
