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
    process: []
  };
  this.getCapabilities()
    .then((process)=> {
      process.forEach((theprocess) => {
        this.state.process.push(theprocess);
      })
    })
    .catch((error) => {
      this.state.error = true;
    })
    .finally(async() => {
      if (this.state.process.length && !this.state.currentProcess) {
        try {
          const id = this.state.process[0].id;
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
  this.state.loading = true;
  const index = this.state.process.findIndex(process => process.id === id);
  let form = this.state.process[index].form;
  if (form)
    this.state.loading = false;
  else {
    try {
      form = this.state.process[index].form = await this._provider.describeProcess({
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
  const features = await this._provider.execute({
    inputs,
    id
  });
  const source = new ol.source.Vector();
  source.addFeatures(features);
  const layer = new ol.layer.Vector({
    source, name: 'Pippo'
  });
  mapService.addExternalLayer(layer);
  this.state.loading = false;
};

proto.clear = function() {

};



module.exports = WPSService;
