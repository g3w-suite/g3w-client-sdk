import ImageComponent from './global-components/image.vue';
import GeospatialComponet  from './global-components/geo.vue';
import barLoader from './global-components/bar-loader';

const GlobalComponents = {
  install(Vue) {
    Vue.component(ImageComponent.name, ImageComponent);
    Vue.component(GeospatialComponet.name, GeospatialComponet);
    Vue.component(barLoader.name, barLoader)
  }
};

module.exports = GlobalComponents;
