const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const ProjectsRegistry = require('core/project/projectsregistry');
const G3WObject = require('core/g3wobject');
const Filter = require('core/layers/filter/filter');
const Expression = require('core/layers/filter/expression');
const SearchPanel = require('gui/search/vue/panel/searchpanel');

function SearchesService() {
  const currentProjectState = ProjectsRegistry.getCurrentProject().state;
  this.title = currentProjectState.search_title || "search";
  this.init = function (searchesObject) {
    const searches = searchesObject || currentProjectState.search;
    this.state.searches = searches;
  };
  this.searchLayer = null;
  this.state = {
    searches: [],
    searchtools: []
  };
}

inherit(SearchesService, G3WObject);

const proto = SearchesService.prototype;

proto.getTitle = function() {
  return this.title;
};

proto.getLayerById = function(layerId) {
  return ProjectsRegistry.getCurrentProject().getLayersStore().getLayerById(layerId);
};

proto.showPanel = function(config={}) {
  const panel =  new SearchPanel();
  config.service = this;
  panel.init(config);
  GUI.showPanel(panel);
  return panel;
};

proto.cleanSearchPanels = function() {
  this.state.panels = {};
};

proto.stop = function(){
  const d = $.Deferred();
  d.resolve();
  return d.promise();
};

proto.addTool = function(searchTool) {
  this.state.searchtools.push(searchTool);
};

proto.addTools = function(searchTools) {
  for (const searchTool of searchTools) {
    this.addTool(searchTool);
  }
};

proto.removeTool = function(searchTool) {
  //TODO
};

proto.removeTools = function() {
  this.state.searchtools.splice(0)
};

proto.reload = function() {
  this.state.searches = ProjectsRegistry.getCurrentProject().state.search;
};

proto.createQueryFilterFromConfig = function({filter}) {
  let queryFilter = {};
  function createOperatorObject(inputObj) {
    for (const operator in inputObj) {
      const input = inputObj[operator];
      if (Array.isArray(input)) {
        createBooleanObject(operator, input);
        break;
      }
    }
    const field = inputObj.attribute;
    const operator = inputObj.op;
    const evalObject = {};
    evalObject[operator] = {};
    evalObject[operator][field] = null;
    return evalObject;
  }

  function createBooleanObject(booleanOperator, inputs = []) {
    const booleanObject = {};
    booleanObject[booleanOperator] = [];
    inputs.forEach((input) => {
      booleanObject[booleanOperator].push(createOperatorObject(input));
    });
    return booleanObject;
  }

  for (const operator in filter) {
    const inputs = filter[operator];
    queryFilter = createBooleanObject(operator, inputs);
  }
  return queryFilter;
};

proto.fillInputsFormFromFilter = function({filter}) {
  let id = 0;
  let formValue;
  const formInputValues = [];
  const forminputs = [];
  for (const operator in filter) {
    const inputs = filter[operator];
    inputs.forEach((input) => {
      formValue = {};
      input.id = id;
      input.input.type = input.input.type || 'textfield';
      formValue.type = input.input.type;
      if (input.input.type === 'selectfield') {
        if (input.input.options.values[0] !== '')
          input.input.options.values.unshift('');
        formValue.value = '';
      } else
        formValue.value = null;
      formInputValues.push(formValue);
      forminputs.push(input);
      id+=1;
    });
  }
  return {
    formInputValues,
    forminputs
  }
};

proto.createQueryFilterObject = function({queryLayer=[], ogcService='wms', filter={}}={}) {
  const info = this.getInfoFromLayer(queryLayer, ogcService);
  const queryFilter = _.merge(info, {
    ogcService: ogcService,
    filter : filter
  });
  return queryFilter
};

proto.getInfoFromLayer = function(layer, ogcService) {
  const queryUrl = ogcService == 'wfs' ? layer.getProject().getWmsUrl() : layer.getQueryUrl();
  return {
    url: queryUrl,
    layers: [],
    infoFormat: layer.getInfoFormat(ogcService),
    crs: layer.getCrs(),
    serverType: layer.getServerType()
  };
};

proto.fillFilterInputsWithValues = function(filterObject, formInputValues, globalIndex) {
  const filter = filterObject.filter;
  for (const operator in filter) {
    const inputs = filter[operator];
    inputs.forEach((input, idx) => {
      for (const operator in input) {
        const _input = input[operator];
        if (Array.isArray(_input))
          fillFilterInputsWithValues(_input, formInputValues, idx);
        else
          for (const fieldName in _input) {
            const index = (globalIndex) ? globalIndex + idx : idx;
            const type = formInputValues[index].type;
            const value = formInputValues[index].value;
            _input[fieldName] = type === 'numberfield' ? parseInt(value): value;
          }
      }
    });
  }
  return filterObject;
};

proto.setSearchLayer = function(layer) {
  this.searchLayer = layer;
};

proto.getSearchLayer = function() {
  return this.searchLayer
};

proto.doSearch = function({url, title="", filter}) {
  GUI.closeContent();
  const showQueryResults = GUI.showContentFactory('query');
  const queryResultsPanel = showQueryResults(title);
  const expression = new Expression();
  const layerName = this.searchLayer.getName();
  expression.createExpressionFromFilter(filter, layerName);
  const _filter = new Filter();
  _filter.setExpression(expression.get());
  this.searchLayer.search({
    filter: _filter,
    queryUrl: url
  })
    .then((results) => {
      results = {
        data: results
      };
      queryResultsPanel.setQueryResponse(results);
    })
    .fail(() => {
      GUI.notify.error(t('server_error'));
    })
};

module.exports = SearchesService;
