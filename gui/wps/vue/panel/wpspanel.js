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
      selectedProcess: null,
      currentInputs: []
    }
  },
  computed: {
    disabled() {
      return this.state.loading || this.state.running;
    },
    currentProcessForm() {
      const currentForm = this.state.currentindex > -1 ? this.state.processes[this.state.currentindex].form : {};
      this.currentInputs = currentForm.inputs || [];
      return currentForm;
    },
    showPickCoordinate() {
      const inputIds = this.currentProcessForm.inputs.map( input => input.id);
      const find = this.pickcoordinateinputs.reduce((accumulator, id) => {
        return accumulator - (!!inputIds.find(inputId => inputId === id)*1);
      }, 2);
      if (find > 0) this.$options.service.deactivePickCoordinateInteraction();
      return !find;
    },
  },
  methods: {
    pickCoordinate() {
      this.$options.service.activePickCoordinateInteraction().then((coordinate) => {
        this.currentProcessForm.inputs.forEach(input => {
          if (input.id === this.pickcoordinateinputs[0]) input.value = coordinate[0];
          if (input.id === this.pickcoordinateinputs[1]) input.value = coordinate[1];
        })
      })
    },
    openInputFile(id) {
      document.getElementById(id).click();
    },
    loadFile({input, event}={}){
      var reader = new FileReader();
      const file = event.target.files[0];
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        input.value = evt.target.result.replace('<?xml version="1.0" encoding="utf-8" ?>','<![CDATA[');
        input.value = input.value.concat(']]>');
      };
      reader.onerror = function (evt) {
        console.log(evt);
      };
    },
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
    'state.processes'(processes) {
      this.selectedProcess = processes[0].identifier;
    }
  },
  created() {
    this.pickcoordinateinputs = this.$options.service.getPickCoordinatesIdentifier();
    this._bbox = {};
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
    this.pickcoordinateinputs = null;
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
