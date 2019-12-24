const inherit = require('core/utils/utils').inherit;
const G3WObject = require('core/g3wobject');
const GUI = require('gui/gui');
const WPSProvider = require('core/layers/providers/wpsprovider');
const readFeaturesFromData = require('core/utils/geo').readFeaturesFromData;
function WPSService(options={}) {
  this._provider = new WPSProvider(options);
  this.state = {
    currentindex: -1,
    result: null,
    running: false,
    loading: true,
    title: options.name,
    error: false,
    processes: []
  };
  this.getCapabilities()
    .then((processes)=> {
      processes.forEach((process) => {
        this.state.processes.push(process);
      })
    })
    .catch((error) => {
      this.state.error = true;
    })
    .finally(async() => {
      if (this.state.processes.length && !this.state.currentProcess) {
        try {
          const id = this.state.processes[0].identifier;
          const processform = await this.describeProcess(id);
          this.state.currentindex = 0;
        } catch (err) {
          console.log(err)
        } finally {
          this.state.loading = false;
        }
      } else {
        this.state.loading = false;
      }
    })
}

inherit(WPSService, G3WObject);

const proto = WPSService.prototype;

proto.getCapabilities = async function(){
  return this._provider.getCapabilities();
};

proto.describeProcess = async function(id) {
  GUI.closeUserMessage();
  this.state.loading = true;
  const index = this.state.processes.findIndex(process => process.identifier === id);
  let form = this.state.processes[index].form;
  if (form)
    this.state.loading = false;
  else {
    try {
      form = this.state.processes[index].form = await this._provider.describeProcess({
        id, format: 'form'
      });
    } catch(err) {
      this.state.error = true;
    } finally {
      this.state.loading = false;
    }
  }
  this.state.currentindex = index;
  return form;
};

proto.run = async function({inputs=[], id}={}){
  this.state.loading = true;
  const mapService = GUI.getComponent('map').getService();
  const response = await this._provider.execute({
    inputs,
    id
  });
  if (response.status === 'ok') {
    const {type, data} = response;
    switch(type) {
      case 'vector':
        const source = new ol.source.Vector();
        source.addFeatures(data);
        const layer = new ol.layer.Vector({
          source,
          name: 'Pippo'
        });
        mapService.addExternalLayer(layer);
        break;
      case 'string':
        GUI.showUserMessage({
          type: 'info',
          message: data
        });
        break;
      default:
        console.log(data)
    }
  } else {
    GUI.showUserMessage({
      type: 'alert',
      message: response.data,
      //autoclose: true
    })
  }

  this.state.loading = false;
};

proto.clear = function() {
  GUI.closeUserMessage();
};



module.exports = WPSService;
