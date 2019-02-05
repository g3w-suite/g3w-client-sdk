const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const t = require('core/i18n/i18n.service').t;
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const CatalogLayersStorRegistry = require('core/catalog/cataloglayersstoresregistry');
const Filter = require('core/layers/filter/filter');
const Expression = require('core/layers/filter/expression');

function SearchService(config={}) {
  this.debounces =  {
    run: {
      fnc: (...args) => {
        this._run(...args)
      }
    }
  };
  base(this);
  // reactivity data
  this.state = {
    title: null,
    dependencies: [],
    cachedependencies:{},
    forminputs: [],
    loading: {},
    searching: false
  };

  this.searchLayer = null;
  this.filter = null;
  this.init = function(config) {
    this.state.title = config.name;
    const options = config.options || {};
    this.url = options.queryurl;
    this.filter = options.filter;
    const layerid = options.querylayerid || options.layerid || null;
    this.searchLayer = CatalogLayersStorRegistry.getLayerById(layerid);
    const filter = options.filter || {AND:[]};
    this.fillInputsFormFromFilter({filter});
  };
  // set run function
  return this.init(config);
}

inherit(SearchService, G3WObject);

const proto = SearchService.prototype;

proto._run = function() {
  this.state.searching = true;
  const filter = this.fillFilterInputsWithValues();
  GUI.closeContent();
  const showQueryResults = GUI.showContentFactory('query');
  const queryResultsPanel = showQueryResults(this.state.title);
  const expression = new Expression();
  const layerName = this.searchLayer.getName();
  expression.createExpressionFromFilter(filter, layerName);
  const _filter = new Filter();
  _filter.setExpression(expression.get());
  this.searchLayer.search({
    filter: _filter,
    queryUrl: this.url
  })
    .then((results) => {
      results = {
        data: results
      };
      queryResultsPanel.setQueryResponse(results);
    })
    .fail(() => {
      GUI.notify.error(t('server_error'));
      GUI.closeContent();
    })
    .always(() => {
      this.state.searching = false;
    })
};

proto.changeInput = function({attribute, value} = {}) {
  const input = this.state.forminputs.find((input) => {
    return attribute === input.attribute
  });
  input.value = value;
};

proto.createQueryFilterFromConfig = function({filter}) {
  let queryFilter;
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

proto.fillDependencyInputs = function({field, subscribers=[], value=''}={}) {
  return new Promise((resolve, reject) => {
    subscribers.forEach((subscribe) => {
      subscribe.options.disabled = true;
    });
    if (value) {

      if (this.state.cachedependencies[field] && this.state.cachedependencies[field][value]) {
        for (let i = 0; i < subscribers.length; i++) {
          const subscribe = subscribers[i];
          const values = this.state.cachedependencies[field][value][subscribe.attribute];
          if (values && values.length) {
            subscribe.options.values.splice(1);
            for (let i = 0; i <values.length; i++) {
              subscribe.options.values.push(values[i]);
            }
          }
          subscribe.value = '';
          subscribe.options.disabled = false;
          resolve()
        }
      } else {
        this.state.loading[field] = true;
        this.state.cachedependencies[field] = this.state.cachedependencies[field] ? this.state.cachedependencies[field] : {};
        this.state.cachedependencies[field][value] = this.state.cachedependencies[field][value] ? this.state.cachedependencies[field][value] : {};
        this.queryService = GUI.getComponent('queryresults').getService();
        const equality = {};
        equality[field] = value;
        const filter = {
          AND: [{
            eq: equality
          }]
        };
        const expression = new Expression();
        const layerName = this.searchLayer.getName();
        expression.createExpressionFromFilter(filter, layerName);
        const _filter = new Filter();
        _filter.setExpression(expression.get());
        this.searchLayer.search({
          filter: _filter
        }).then((response) => {
          const digestResults = this.queryService._digestFeaturesForLayers(response);
          if (digestResults.length) {
            const features = digestResults[0].features;
            for (let i = 0; i < subscribers.length; i++) {
              const subscribe = subscribers[i];
              subscribe.value = '';
              subscribe.options.values.splice(1);
              let uniqueValue = new Set();
              features.forEach((feature) => {
                let value = feature.attributes[subscribe.attribute];
                if (value && !uniqueValue.has(value)) {
                  subscribe.options.values.push(value);
                  uniqueValue.add(value);
                }
              });
              subscribe.options.values.sort();
              this.state.cachedependencies[field][value][subscribe.attribute] = subscribe.options.values.slice(1);
              subscribe.options.disabled = false;
            }
          } else
            subscribe.options.values.splice(1);
        }).fail((err) => {})
          .always(() => {
            this.state.loading[field] = false;
            resolve();
          })
      }
    } else {
      for (let i = 0; i < subscribers.length; i++) {
        const subscribe = subscribers[i];
        subscribe.options.disabled = true;
        subscribe.options.values.splice(1);
      }
      resolve()
    }
  })
};

proto._checkInputDependencies = function(forminput) {
  if (forminput.options.dependance) {
    const key = forminput.options.dependance;
    let dependency = this.state.dependencies.find((_dependency) => {
      _dependency.observer === key;
    });
    if (!dependency) {
      dependency = {
        observer: key,
        subscribers: []
      };
      this.state.dependencies.push(dependency)
    }
    dependency.subscribers.push(forminput)
  }
};

proto.fillInputsFormFromFilter = function({filter}) {
  let id = 0;
  for (const operator in filter) {
    const inputs = filter[operator];
    inputs.forEach((input) => {
      const forminput = {
        label: input.label,
        attribute: input.attribute,
        type: input.input.type || 'textfield',
        options: Object.assign({}, input.input.options),
        value: '',
        id: input.id
      };

      if (forminput.type === 'selectfield') {
        const field = forminput.options.dependance;
        if (field) {
          this.state.loading[field] = false;
          forminput.options.disabled = true;
        }
        if (forminput.options.values[0] !== '')
          //add a starting all
          forminput.options.values.unshift('');
        forminput.value = '';
      } else
        forminput.value = null;
      this._checkInputDependencies(forminput);
      this.state.forminputs.push(forminput);
      id+=1;
    });
  }
};

proto.createQueryFilterObject = function({ogcService='wms', filter={}}={}) {
  const info = this.getInfoFromLayer(ogcService);
  Object.assign(info, {
    ogcService: ogcService,
    filter : filter
  });
  return info;
};

proto.getInfoFromLayer = function(ogcService) {
  const queryUrl = ogcService == 'wfs' ? this.searchLayer.getProject().getWmsUrl() : this.searchLayer.getQueryUrl();
  return {
    url: queryUrl,
    layers: [],
    infoFormat: this.searchLayer.getInfoFormat(ogcService),
    crs: this.searchLayer.getCrs(),
    serverType: this.searchLayer.getServerType()
  };
};

proto.fillFilterInputsWithValues = function(filter=this.filter, filterWithValues={}) {
  const forminputs = this.state.forminputs;
  for (const operator in filter) {
    filterWithValues[operator] = [];
    const inputs = filter[operator];
    inputs.forEach((input) => {
      const _input = input.input;
      if (Array.isArray(_input)){
        this.fillFilterInputsWithValues(_input);
      } else {
        const _operator = input.op;
        const fieldName = input.attribute;
        const filterInput = {};
        filterInput[_operator] = {};
        const forminputwithvalue = forminputs.find((forminput) => {
            return forminput.attribute === fieldName;
        });
        const type = forminputwithvalue.type;
        const value = forminputwithvalue.value;
        filterInput[_operator][fieldName] = type === 'numberfield' ? parseInt(value) : value;
        filterWithValues[operator].push(filterInput);
      }
    })
  }
  return filterWithValues;
};



proto.setSearchLayer = function(layer) {
  this.searchLayer = layer;
};

proto.getSearchLayer = function() {
  return this.searchLayer
};

proto.clear = function() {
  this.state = null;
};

module.exports = SearchService;
