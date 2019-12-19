const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const Panel = require('gui/panel');
const Service = require('gui/wps/service');

const WpsPanelComponent = Vue.extend({
  template: require('./wpspanel.html'),
  components:{},
  data() {
    return {
      state: this.$options.service.state,
      selectedProcess: null
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
     this.state.loading = true;
     this.$options.service.run({
       inputs: this.currentProcessForm.inputs,
       id: this.selectedProcess
     });
    }
  },
  watch: {
    'state.process'(process) {
      this.selectedProcess = process[0].id;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.select2 = $('#wps_processes').select2();
      this.select2.on('select2:select', (evt) => {
        const id = evt.params.data.id;
        this.selectedProcess = id;
        this.$options.service.describeProcess(id);
      })
    })
  },
  updated() {
    this.inputSelect && this.inputSelect.select2('destroy');
    this.$nextTick(()=> {
      this.inputSelect = $('#g3w-wps-form .inputdata select').select2();
    })
  },
  beforeDestroy() {
    this.inputSelect && this.inputSelect.select2('destroy');
    this.select2.select2('destroy');
  }
});

function WPSpanel(options={}) {
  const service = new Service(options);
  const internalPanel = new WpsPanelComponent({
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
