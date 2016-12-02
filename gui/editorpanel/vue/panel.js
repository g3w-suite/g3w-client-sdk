var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var PanelService = require('gui/editorpanel/panelservice');
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var PanelTemplate = require('./panel.html');
var resolve = require('core/utils/utils').resolve;

var vueComponentOptions = {
  template: null,
  data: null,
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    toggleEditing: function() {
      //si ha quando viene avviata o terminata una sessione di editing
      this.$options.service.toggleEditing();
    },
    saveEdits: function() {
      //chaiamata quando si preme su salva edits
      this.$options.service.saveEdits();
    },
    toggleEditTool: function(layerCode, toolType) {
      //chiamato quando si clicca su un tool dell'editor
      if (toolType == '') {
        return;
      }
      if (this.state.editing.on) {
        this.$options.service.toggleEditTool(layerCode, toolType);
      }
    },
    editingtoolbtnToggled: function(layerCode, toolType) {
      return (this.state.editing.layerCode == layerCode && this.state.editing.toolType == toolType);
    },
    editingtoolbtnEnabled: function(tool) {
      return tool.tooltype != '';
    },
    onClose: function() {
      this.$options.service.stop();
    }
  },
  computed: {
    editingbtnlabel: function() {
      return this.state.editing.on ? "Termina editing" : "Avvia editing";
    },
    editingbtnEnabled: function() {
      return (this.state.editing.enabled || this.state.editing.on) ? "" : "disabled";
    },
    message: function() {
      var message = "";
      if (!this.state.editing.enabled) {
        message = '<span style="color: red">Aumentare il livello di zoom per abilitare l\'editing';
      }
      else if (this.state.editing.toolstep.message) {
        var n = this.state.editing.toolstep.n;
        var total = this.state.editing.toolstep.total;
        var stepmessage = this.state.editing.toolstep.message;
        message = '<div style="margin-top:20px">GUIDA STRUMENTO:</div>' +
          '<div><span>['+n+'/'+total+'] </span><span style="color: yellow">'+stepmessage+'</span></div>';
      }
      return message;
    }
  }
};


function PanelComponent(options) {

  var self = this;
  // proprietà necessarie. In futuro le mettermo in una classe Panel
  // da cui deriveranno tutti i pannelli che vogliono essere mostrati nella sidebar
  base(this, options);
  // qui vado a tenere traccia delle due cose che mi permettono di customizzare
  // vue component e service
  this.vueComponent = vueComponentOptions;
  this.name = options.name || 'Gestione dati';
  merge(this, options);
  // dichiaro l'internal Component
  this.internalComponent = null;
  //template from component
  this._template = options.template || PanelTemplate;
  // edittoolbar
  this._editorsToolbars = options.editorsToolBars || [];
  // save buttons
  this._saveBtnLabel = options.saveBtnLabel || "Salva";
  // resource urls
  this._resourcesUrl = options.resourcesUrl || GUI.getResourcesUrl();
  // settor il service del component
  this._service = options.service || new PanelService;
  // setto il componente interno
  this.setInternalComponent = function () {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      service: this._service,
      template: this._template,
      data: function() {
        return {
          //lo state è quello del servizio in quanto è lui che va a modificare operare sui dati
          state: self._service.state,
          resourcesurl: self._resourcesUrl,
          editorstoolbars: self._editorsToolbars,
          savebtnlabel: self._saveBtnLabel
        }
      }
    });
    this.internalComponent.state = this._service.state;
    return this.internalComponent;
  };
  // sovrascrivo richiamando il padre in append
  this.mount = function(parent) {
    return base(this, 'mount', parent, true)
  };
}

inherit(PanelComponent, Component);

module.exports = PanelComponent;


