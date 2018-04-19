const inherit = require('core/utils/utils').inherit;
const t = require('core/i18n/i18n.service').t;
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
      queryurl: null
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
        GUI.notify.error(t('server_error'));
        GUI.closeContent();
      })
    }
  },
  mounted() {
    function matchCustom(params, data) {
      // If there are no search terms, return all of the data
      if ($.trim(params.term) === '') {
        return data;
      }

      // Do not display the item if there is no 'text' property
      if (typeof data.text === 'undefined') {
        return null;
      }

      // `params.term` should be the term that is used for searching
      // `data.text` is the text that is displayed for the data object
      if (data.text.indexOf(params.term) > -1) {
        const modifiedData = $.extend({}, data, true);
        // You can return modified objects from here
        // This includes matching the `children` how you want in nested data sets
        return modifiedData;
      }

      // Return `null` if the term should not be displayed
      return null;
    }

    this.$nextTick(() => {
      this.$on('select-change', (options) => {
        this.formInputValues[options.index].value = options.value;
      });
      $('#g3w-search-form select').select2({
        width: '100%',
        matcher: matchCustom,
        "language": {
          "noResults": function(){
            return t("no_results");
          }
        },
      }).on('change', (evt) => {
        const select = $(evt.target);
        this.$emit('select-change', {
          index: select.attr('id'),
          value: select.val()
        })
      })
    })

  }
});

function SearchPanel(options = {}) {
  this.config = {};
  this.filter = {};
  this.id = null;
  this.querylayerid = null;
  this.internalPanel = options.internalPanel || new SearchPanelComponet();
  this.init = function(config = {}) {
    this.config = config;
    this.name = this.config.name || this.name;
    this.id = this.config.id || this.id;
    this.filter = this.config.options.filter || this.filter;
    // const input = this.filter.AND[0].input;
    // input.type = 'selectfield';
    // input.options.values = ['pippo','pluto', 'paperino49', 'pluto48', '49', '48'];
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
        input.input.type = input.input.type || 'textfield';
        formValue.type = input.input.type;
        if (input.input.type == 'selectfield') {
          input.input.options.values.unshift('');
          formValue.value = '';
        } else
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
    _.forEach(filter, function(v,k, obj) {
      queryFilter = createBooleanObject(k,v);
    });
    return queryFilter;
  };

  this.createQueryFilterObject = function(options) {
    options = options || {};
    const queryLayer = options.queryLayer || [];
    const ogcService = options.ogcService || 'wms';
    const filter =  options.filter || {};
    let queryFilter;
    const info = this.getInfoFromLayer(queryLayer, ogcService);
    queryFilter = _.merge(info, {
      ogcService: ogcService,
      filter : filter
    });
    return queryFilter
  };

  this.getInfoFromLayer = function(layer, ogcService) {
    const urlForLayer = {};
    let queryUrl;
    if (ogcService == 'wfs') {
      queryUrl = layer.getProject().getWmsUrl();
    } else {
      queryUrl = layer.getQueryUrl();
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
