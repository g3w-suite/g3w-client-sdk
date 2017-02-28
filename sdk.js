var g3w = g3w || {};

g3w.core = {
   G3WObject: require('core/g3wobject'),
   utils: require('core/utils/utils'),
   ApplicationService: require('core/applicationservice'),
   ApiService: require('core/apiservice'),
   Router: require('core/router'),
   ProjectsRegistry: require('core/project/projectsregistry'),
   Project: require('core/project/project'),
   QueryService: require('core/query/queryservice'),
   MapLayer: require('core/map/layer/maplayer'),
   VectorLayer: require('core/map/layer/vectorlayer'),
   WmsLayer: require('core/map/layer/wmslayer'),
   VectorLayerLoader: require('core/map/layer/loader/vectorloaderlayer'),
   Geometry: require('core/geometry/geometry'),
   geom: require('core/geometry/geom'),
   PickCoordinatesInteraction: require('g3w-ol3/src/interactions/pickcoordinatesinteraction'),
   PickFeatureInteraction: require('g3w-ol3/src/interactions/pickfeatureinteraction'),
   i18n: require('core/i18n/i18n.service'),
   Plugin: require('core/plugin/plugin'),
   PluginsRegistry: require('core/plugin/pluginsregistry'),
   PluginService: require('core/plugin/pluginservice'),
   Editor: require('core/editing/editor'),
   EditBuffer: require('core/editing/editbuffer'),
   RelationEditBuffer: require('core/editing/relationeditbuffer')
};

g3w.gui = {
  GUI: require('gui/gui'),
  Panel: require('gui/panel'),
  ControlFactory: require('gui/map/control/factory'),
  vue: {
    Component: require('gui/vue/component'),
    SearchComponent: require('gui/search/vue/search'),
    SearchPanel: require('gui/search/vue/panel/searchpanel'),
    PrintComponent: require('gui/print/vue/print'),
    CatalogComponent: require('gui/catalog/vue/catalog'),
    MapComponent: require('gui/map/vue/map'),
    ToolsComponent: require('gui/tools/vue/tools'),
    QueryResultsComponent : require('gui/queryresults/vue/queryresults'),
    FormComponent: require('gui/form/vue/form'),
    PanelComponent: require('gui/editorpanel/vue/panel')
  }
};

g3w.ol3 = {
  interactions : {
    PickFeatureInteraction : require('g3w-ol3/src/interactions/pickfeatureinteraction')
  },
  controls: {
  }
};

module.exports = {
  core: g3w.core,
  gui: g3w.gui,
  ol3: g3w.ol3
};
