const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const t = require('core/i18n/i18n.service').t;
const Panel = require('gui/panel');
const Service = require('./searchservice');
import Select2 from './select2.vue'

const SearchPanelComponent = Vue.extend({
  template: require('./searchpanel.html'),
  components:{
    Select2
  },
  data: function() {
    this.select2 = null;
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
    changeInput({attribute, value}={}) {
      this.$options.service.changeInput({attribute, value});
      const dependency = !!this.state.dependencies.length && this.state.dependencies.find((_dependency) => {
        return attribute === _dependency.observer
      });
      if (dependency) {
        this.state.searching = true;
        this.$options.service.fillDependencyInputs({
          field: attribute,
          subscribers: dependency.subscribers,
          value
        }).then(()=> {
          this.state.searching = false;
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
      this.select2 = $('#g3w-search-form > select').select2({
        width: '100%',
        matcher: matchCustom,
        "language": {
          "noResults": function(){
            return t("no_results");
          }
        },
      });
      this.select2.on('select2:select', (evt) => {
        const attribute = $(evt.target).attr('name');
        const value = evt.params.data.id;
        this.selectChange(attribute, value);
        this.$options.service.changeInput({
          attribute,
          value
        })

      })
    })
  },
  beforeDestroy() {
    this.select2.off('select2:select');
    this.select2 = null;
  }
});

function SearchPanel(options = {}) {
  const service = options.service || new Service(options);
  const SearchPanel = options.component || SearchPanelComponent;
  const internalPanel = new SearchPanel({
    service
  });
  this.setInternalPanel(internalPanel);
  this.unmount = function() {
    return base(this, 'unmount').then(() => {
      service.clear()
    })
  }
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
