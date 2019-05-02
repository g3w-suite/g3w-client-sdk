const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
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
    changeDependencyFields({attribute, value, fillfieldspromises=[]}) {
      const dependency = this.state.dependencies.find((_dependency) => {
        return attribute === _dependency.observer
      });
      if (dependency) {
        const subscribers = dependency.subscribers || [];
        for (let i = subscribers.length; i--;) {
          const forminputvalue = this.state.forminputs.find((input) => {
            return input.attribute === subscribers[i].attribute;
          });
          fillfieldspromises.push(this.$options.service.fillDependencyInputs({
            field: attribute,
            subscribers,
            value
          }));
          forminputvalue.value = '';
          this.changeDependencyFields({
            attribute: forminputvalue.attribute,
            value: forminputvalue.value,
            fillfieldspromises
          })
        }
      }
      return fillfieldspromises;
    },
    changeInput({attribute, value}={}) {
      this.$options.service.changeInput({attribute, value});
      //check id there are dependencies
      const fillDependencyPromises = this.changeDependencyFields({
        attribute,
        value
      });
      if (fillDependencyPromises.length) {
        this.state.searching = true;
        Promise.all(fillDependencyPromises).then(() => {
          this.state.searching = false;
        })
      }
    },
    doSearch: function(event) {
      event.preventDefault();
      this.$options.service.run();
    }
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
