const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const t = require('core/i18n/i18n.service').t;
const Panel = require('gui/panel');
const Service = require('./searchservice');

const SearchPanelComponent = Vue.extend({
  template: require('./searchpanel.html'),
  data: function() {
    return {
     state: this.$options.service.state
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
    selectChange(attribute, value) {
      const dependency = !!this.state.dependencies.length && this.state.dependencies.find((_dependency) => {
        return attribute === _dependency.observer
      });
      if (dependency) {
        this.$options.service.fillDependencyInputs({
          field: attribute,
          subscribers: dependency.subscribers,
          value
        });
        if (!value) {
          for (let i =0; i< dependency.subscribers.length; i++) {
            const forminputvalue = this.state.forminputs.find((input) => {
              return input.attribute === dependency.subscribers[i].attribute;
            });
            forminputvalue.value = '';
          }
        }
      }
    },
    doSearch: function(event) {
      event.preventDefault();
      this.$options.service.run();
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
      $('#g3w-search-form > select').select2({
        width: '100%',
        matcher: matchCustom,
        "language": {
          "noResults": function(){
            return t("no_results");
          }
        },
      })
    })
  }
});

function SearchPanel(options = {}) {
  const service = options.service || new Service(options);
  const SearchPanel = options.component || SearchPanelComponent;
  const internalComponent = new SearchPanel({
    service
  });
  this.setInternalPanel(internalComponent);
  this.unmount = function() {
    return base(this, 'unmount').then(() => {
      service.clear()
    })
  }
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
