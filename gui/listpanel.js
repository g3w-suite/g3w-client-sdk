const resolve = require('core/utils/utils').resolve;
const GUI = require('gui/gui');

const ListPanelComponent = Vue.extend({
  template: require('./listpanel.html'),
  methods: {
    exec: function(cbk){
      const relations = this.state.relations || null;
      cbk(this.state.fields,relations);
      GUI.closeForm();
    }
  }
});


function ListPanel(options){
  this.panelComponent = null;
  this.options =  options || {};
  this.id = options.id || null; 
  this.name = options.name || null; 
  
  this.state = {
    list: options.list || []
  };
  
  this._listPanelComponent = options.listPanelComponent || ListPanelComponent;
}

const proto = ListPanel.prototype;

proto.onShow = function(container){
  var panel = this._setupPanel();
  this._mountPanel(panel,container);
  return resolve(true);
};

proto.onClose = function(){
  this.panelComponent.$destroy(true);
  this.panelComponent = null;
  return resolve(true);
};

proto._setupPanel = function(){
  const panel = this.panelComponent = new this._listPanelComponent({
    panel: this
  });
  panel.state = this.state;
  return panel
};

proto._mountPanel = function(panel,container){
  panel.$mount().$appendTo(container);
};

module.exports = {
  ListPanelComponent: ListPanelComponent,
  ListPanel: ListPanel
};
