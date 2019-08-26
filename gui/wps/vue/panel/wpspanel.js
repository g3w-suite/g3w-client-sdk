const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Panel = require('gui/panel');
const Service = require('gui/wps/service');

const WpsPanelComponent = Vue.extend({
  template: require('./wpspanel.html'),
  components:{},
  data() {
    return {
      state: this.$options.service.state
    }
  },
  computed: {
    disabled() {
      return this.state.loading || this.state.running;
    },
    currentProcessForm() {
      return this.state.currentindex > -1 ? this.state.process[this.state.currentindex].form : {};
    }
  },
  methods: {
    run: function(event) {
     event.preventDefault();
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.select2 = $('#wps_processes').select2();
      this.select2.on('select2:select', (evt) => {
        const id = evt.params.data.id;
        this.$options.service.describeProcess(id)
      })
    })
  },
  beforeDestroy() {
    this.select2.select2('destroy');
  }
});

function WPSpanel(options={}) {
  const service = new Service(options);
  const Panel = WpsPanelComponent;
  const internalPanel = new Panel({
    service
  });
  this.setInternalPanel(internalPanel);
  this.unmount = function() {
    return base(this, 'unmount').then(() => {
      service.clear()
    })
  }
}

inherit(WPSpanel, Panel);

module.exports = WPSpanel;
