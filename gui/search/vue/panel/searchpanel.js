const inherit = require('core/utils/utils').inherit;
const t = require('core/i18n/i18n.service').t;
const GUI = require('gui/gui');
const Panel = require('gui/panel');

const SearchPanelComponet = Vue.extend({
  template: require('./searchpanel.html'),
  data: function() {
    return {
      title: "",
      forminputs: [],
      formInputValues : [],
      filterObject: null,
      queryurl: null
    }
  },
  methods: {
    onFocus(event) {
      if (this.isMobile()) {
        const top = $(event.target).position().top - 10 ;
        this.$nextTick(()=> {
          setTimeout(() => {
            $('.sidebar').scrollTop(top);
          }, 500)
        });

      }
    },
    doSearch: function(event) {
      event.preventDefault();
      const filterObject = this.service.fillFilterInputsWithValues(this.filterObject, this.formInputValues);
      this.service.doSearch({
        url: this.queryurl,
        title: this.title,
        filter: filterObject.filter
      });
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
      $('#g3w-search-form > select').select2({
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
  this.config;
  this.id;
  this.querylayerid;
  this.internalPanel = options.internalPanel || new SearchPanelComponet();

  this.init = function(config = {}) {
    this.config = config;
    const Service = require('gui/search/searchesservice');
    this.service = config.service || new Service();
    this.name = this.config.name || this.name;
    this.id = this.config.id || this.id;
    const filter = this.config.options.filter || filter;
    const queryLayerId = this.config.options.querylayerid || this.querylayerid;
    const queryLayer = this.service.getLayerById(queryLayerId);
    this.service.setSearchLayer(queryLayer);
    Object.assign(this.internalPanel, this.service.fillInputsFormFromFilter({
      filter
    }));
    const filterObjFromConfig = this.service.createQueryFilterFromConfig({
      filter
    });
    this.internalPanel.filterObject = this.service.createQueryFilterObject({
      queryLayer,
      filter: filterObjFromConfig
    });
    this.internalPanel.queryurl = this.config.options.queryurl || null;
    this.internalPanel.service = this.service;
    this.internalPanel.title = this.name;
  };
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
