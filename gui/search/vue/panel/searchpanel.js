const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const Panel = require('gui/panel');
const ProjectsRegistry = require('core/project/projectsregistry');
const Filter = require('core/layers/filter/filter');
const Expression = require('core/layers/filter/expression');

const SearchPanelComponet = Vue.extend({
  template: require('./searchpanel.html'),
  data: function() {
    return {
      title: "",
      forminputs: [],
      filterObject: {},
      formInputValues : [],
      queryurl: null,
      loading: false
    }
  },
  methods: {
    doSearch: function(event) {
      event.preventDefault();
      this.filterObject = this.fillFilterInputsWithValues(this.filterObject, this.formInputValues);
      if (this.queryurl) {
        this.filterObject.url = this.queryurl;
      }
      const showQueryResults = GUI.showContentFactory('query');
      const queryResultsPanel = showQueryResults(this.title);
      const filter = new Filter();
      const expression = new Expression();
      expression.createExpressionFromFilter(this.filterObject.filter, this.queryLayer.getName());
      filter.setExpression(expression.get());
      this.loading = true;
      this.queryLayer.search({
        filter: filter,
        queryUrl: this.queryurl
      })
      .then((results) => {
        results = {
          data: results
        };
         queryResultsPanel.setQueryResponse(results);
      })
      .fail(() => {
        GUI.notify.error('Si è verificato un errore nella richiesta al server');
        GUI.closeContent();
      })
      .always(() => {
        this.loading = false
      })
    }
  }
});

function SearchPanel(options) {
  options = options || {};
  this.config = {};
  this.filter = {};
  this.id = null;
  this.querylayerid = null;
  this.internalPanel = options.internalPanel || new SearchPanelComponet();
  this.init = function(config) {
    this.config = config || {};
    this.name = this.config.name || this.name;
    this.id = this.config.id || this.id;
    this.filter = this.config.options.filter || this.filter;
    this.internalPanel.queryurl = this.config.options.queryurl || null;
    const queryLayerId = this.config.options.querylayerid || this.querylayerid;
    this.queryLayer = ProjectsRegistry.getCurrentProject().getLayersStore().getLayerById(queryLayerId);
    this.fillInputsFormFromFilter();
    const filterObjFromConfig = this.createQueryFilterFromConfig(this.filter);
    this.internalPanel.filterObject = this.createQueryFilterObject({
      queryLayer: this.queryLayer,
      filter: filterObjFromConfig
    });
    this.internalPanel.filterObject = this.internalPanel.filterObject;
    this.internalPanel.queryLayer = this.queryLayer;
    this.internalPanel.fillFilterInputsWithValues = this.fillFilterInputsWithValues;
    this.internalPanel.title = this.name;
  };
 
  this.fillInputsFormFromFilter = function() {
    let id = 0;
    let formValue;
    _.forEach(this.filter, (v,k,obj) => {
      _.forEach(v, (input) => {
        formValue = {};
        input.id = id;
        formValue.type = input.input.type;
        formValue.value = null;
        this.internalPanel.formInputValues.push(formValue);
        this.internalPanel.forminputs.push(input);
        id+=1;
      });
    });
  };
  
  this.fillFilterInputsWithValues = function(filterObject, formInputValues, globalIndex) {
    function convertInputValueToInputType(type, value) {
      switch(type) {
        case 'numberfield':
             value = parseInt(value);
             break;
        default:
             break;
      }
      return value;
    }
    _.forEach(filterObject.filter, (v,k) => {
      _.forEach(v, (input, idx) => {
        _.forEach(input, (v, k, obj) => {
          if (_.isArray(v)) {
            fillFilterInputsWithValues(input, formInputValues, idx);
          } else {
            _.forEach(v, (v, k, obj) => {
              index = (globalIndex) ? globalIndex + idx : idx;
              obj[k] = convertInputValueToInputType(formInputValues[index].type, formInputValues[index].value);
            });
          }
        });
      });
    });
    return filterObject;
  };

  this.createQueryFilterFromConfig = function(filter) {
    let queryFilter = {};
    let operator;
    let field;
    let booleanObject = {};
    function createOperatorObject(obj) {
      evalObject = {};
      _.forEach(obj, function(v,k) {
        if (_.isArray(v)) {
          return createBooleanObject(k,v);
        }
      });
      field = obj.attribute;
      operator = obj.op;
      evalObject[operator] = {};
      evalObject[operator][field] = null;
      return evalObject;
    }
    function createBooleanObject(booleanOperator, operations) {
      booleanObject = {};
      booleanObject[booleanOperator] = [];
      _.forEach(operations, function(operation){
        booleanObject[booleanOperator].push(createOperatorObject(operation));
      });
      return booleanObject;
    }
    _.forEach(filter, function(v,k,obj) {
      queryFilter = createBooleanObject(k,v);
    });
    return queryFilter;
  };
  
  this.createQueryFilterObject = function(options) {
    var options = options || {};
    var queryLayer = options.queryLayer || [];
    var ogcService = options.ogcService || 'wms';
    var filter =  options.filter || {};
    var queryFilter;
    var info = this.getInfoFromLayer(queryLayer, ogcService);
    queryFilter = _.merge(info, {
      ogcService: ogcService,
      filter : filter 
    });
    return queryFilter
  };
  
  this.getInfoFromLayer = function(layer, ogcService) {
    const urlForLayer = {};
    if (ogcService == 'wfs') {
      var queryUrl = layer.getProject().getWmsUrl();
    } else {
      var queryUrl = layer.getQueryUrl();
    }
    urlsForLayer = {
      url: queryUrl,
      layers: [],
      infoFormat: layer.getInfoFormat(ogcService),
      crs: layer.getCrs(), 
      serverType: layer.getServerType() 
    };
    return urlForLayer;
  };
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
