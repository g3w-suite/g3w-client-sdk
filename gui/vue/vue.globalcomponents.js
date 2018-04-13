import ImageComponent from './global-components/image.vue';
import GeospatialComponet  from './global-components/geo.vue';

const GlobalComponents = {
  install(Vue) {
    Vue.component(ImageComponent.name, ImageComponent);
    Vue.component(GeospatialComponet.name, GeospatialComponet); 
  }
};

module.exports = GlobalComponents;
