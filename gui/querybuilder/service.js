const Expression = require('core/layers/filter/expression');
const Filter = require('core/layers/filter/filter');
const CatalogLayersStorRegistry = require('core/catalog/cataloglayersstoresregistry');
const ApplicationService = require('core/applicationservice');
const ProjectsRegistry = require('core/project/projectsregistry');
const GUI = require('gui/gui');
const uniqueId = require('core/utils/utils').uniqueId;
const t = require('core/i18n/i18n.service').t;
const getAlphanumericPropertiesFromFeature = require('core/utils/geo').getAlphanumericPropertiesFromFeature;
const QUERYBUILDERSEARCHES = 'QUERYBUILDERSEARCHES';

function QueryBuilderService(options={}){
  this._cacheValues = {};
}

const proto = QueryBuilderService.prototype;

proto.getItems = function(projectId) {
  projectId = projectId || ProjectsRegistry.getCurrentProject().getId();
  const items = ApplicationService.getLocalItem(QUERYBUILDERSEARCHES);
  return items ? items[projectId] || [] : [];
};

proto._getLayerById = function(layerId){
  return CatalogLayersStorRegistry.getLayerById(layerId);
};

proto.getValues = async function({layerId, field}={}){
  this._cacheValues[layerId] = this._cacheValues[layerId] || {};
  let valuesField = this._cacheValues[layerId][field];
  if (valuesField  === undefined) {
    try {
      const data = await this.run({
        layerId,
        filter: `"${field}" != '__G3W_ALL_VALUES__'`,
        showResult: false
      });
      if (data[0].features.length) {
        const feature  = data[0].features[0];
        const fields = getAlphanumericPropertiesFromFeature(feature.getProperties());
        fields.forEach(field => {
          this._cacheValues[layerId][field] = new Set();
        });
        data[0].features.forEach(feature => {
          fields.forEach(field => {
            this._cacheValues[layerId][field].add(feature.get(field));
          })
        });
      }
      return this._cacheValues[layerId][field] || [];
    } catch(err) {
      reject();
    }
  } else return valuesField;
};

proto.run = function({layerId, filter, showResult=true}={}){
  const layer = this._getLayerById(layerId);
  const layerName = layer.getWMSLayerName();
  const expression = new Expression({
    layerName,
    filter
  });
  const _filter = new Filter();
  _filter.setExpression(expression.get());
  return new Promise((resolve, reject) => {
    layer.search({
      filter: _filter,
      feature_count: 100
    }).then((data) =>{
      if (showResult){
        const showQueryResults = GUI.showContentFactory('query');
        const queryResultsPanel = showQueryResults();
        queryResultsPanel.setQueryResponse({
          data
        });
      }
      resolve(data)
    }).fail((err)=>{
      reject(err)
    })
  });
};

proto.test = async function({layerId, filter}={}){
  console.log(filter)
  try {
    const data = await this.run({
      layerId,
      filter,
      showResult: false
    });
    return data.length && data[0].features.length;
  } catch(err){
    err = t('sdk.querybuilder.error_test');
    return Promise.reject(err);
  }
};

proto.delete = function({id}={}){
  return new Promise((resolve, reject) => {
    GUI.dialog.confirm(t('sdk.querybuilder.delete'), (result)=>{
      if (result) {
        const querybuildersearches = this.getItems().filter(item => item.id !== id);
        const projectId = ProjectsRegistry.getCurrentProject().getId();
        if (querybuildersearches.length === 0) {
          const saveitems = ApplicationService.getLocalItem(QUERYBUILDERSEARCHES);
          delete saveitems[projectId];
          if (Object.keys(saveitems).length)
            ApplicationService.setLocalItem({
              id: QUERYBUILDERSEARCHES,
              data: saveitems
            });
          else ApplicationService.removeLocalItem(QUERYBUILDERSEARCHES);
        }
        resolve();
      } else reject();
    })
  })
};

proto.addLocalItem = function(projectId, querybuildersearch) {
  querybuildersearch.id = uniqueId();
  projectId = projectId || ProjectsRegistry.getCurrentProject().getId();
  const querybuildersearches = ApplicationService.getLocalItem(QUERYBUILDERSEARCHES);
  if (querybuildersearches === undefined)
    ApplicationService.setLocalItem({
      id: QUERYBUILDERSEARCHES,
      data: {
        [projectId]: [querybuildersearch]
      }
    });
  else {
    querybuildersearches[projectId] =  querybuildersearches[projectId] ? [...querybuildersearches[projectId], querybuildersearch] : [querybuildersearch];
    ApplicationService.setLocalItem({
      id: QUERYBUILDERSEARCHES,
      data: querybuildersearches
    })
  }
};

proto.save = function({layerId, filter, projectId} = {}){
  GUI.dialog.prompt(t('sdk.querybuilder.additem'), (result)=>{
    if (result) {
      const layerName = this._getLayerById(layerId).getName();
      const searchService = GUI.getComponent('search').getService();
      const querybuildersearch = {
        name: result,
        layerId,
        filter,
        layerName
      };
      searchService.addQueryBuilderSearch(querybuildersearch);
      this.addLocalItem(projectId, querybuildersearch);
    }
  })
};

proto.all = function() {};

proto.sample = function(){};

proto.clear = function(){
  this._cacheValues = {};
};

proto.add = function() {};


export default new QueryBuilderService;
