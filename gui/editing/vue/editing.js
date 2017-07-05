var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var EditingService = require('gui/editing/editingservice');
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var EditingTemplate = require('./editing.html');

var events = new Vue();

var vueComponentOptions = {
  template: null,
  data: null,
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    toggleEditing: function(control) {
      //this.$options.service.toggleEditing();
      if (control.editing.on) {
        events.emit("control:stop", control);
      }
      else {
        events.emit("control:start", control);
      }
    },
    saveEdits: function(control) {
      //chaiamata quando si preme su salva edits
      events.emit("control:save", control);
    },
    toggletool: function(tool) {
      if (tool.started) {
        events.emit("tool:stop", tool);
      }
      else {
        events.emit("tool:start", control);
      }
    },
    onClose: function() {
      events.emit("close");
    }
  },
  computed: {
    editingbtnlabel: function() {
      return this.state.editing.on ? "Termina editing" : "Avvia editing";
    },
    toolEnabled: function() {
      return (!this.state.editing.error && (this.state.editing.enabled || this.state.editing.on)) ? "" : "disabled";
    },
    startorstop: function(control) {
      return this.service
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
  this._template = options.template || EditingTemplate;
  // edittoolbar
  this._editorsControls = options.editorsControls || [];
  // save buttons
  this._labels = {
    start: "Avvia modifica",
    stop: "Disattiva modifica",
    save: "Salve"
  };
  this._saveBtnLabel = options.saveBtnLabel || "Salva";
  // resource urls
  this._resourcesUrl = options.resourcesUrl || GUI.getResourcesUrl();
  // settor il service del component settando le relative opzioni
  var serviceOptions = options.serviceOptions || {};
  this._service = options.service || new EditingService(serviceOptions);
  // setto il componente interno
  this.setInternalComponent = function () {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      template: this._template,
      data: function() {
        return {
          //lo state è quello del servizio in quanto è lui che va a modificare operare sui dati
          state: self._service.state,
          editorscontrols: self._editorsControls,
          resourcesurl: self._resourcesUrl,
          labels: self._labels
        }
      }
    });
    return this.internalComponent;
  };

  // sovrascrivo richiamando il padre in append
  this.mount = function(parent) {
    return base(this, 'mount', parent, true)
  };

  this.unmount = function() {
    // faccio in modo che venga disattivato l'eventuale tool attivo al momento del
    // click sulla x
    this._service.stop();
    return base(this, 'unmount');
  };

  events.on("close",function(){
    self.unmount();
  });

  events.on("control:start", function(control){
    // inizia editing layer
  });

  events.on("control:stop", function(control){
    // termina editing layer
  });

  events.on("control:save", function(control){
    // salva editing layer
  });

  events.on("tool:start", function(tool){
    // inizia operazione di editing
  });

  events.on("tool:stop", function(tool){
    // termina operazione di editing
  });
}

inherit(PanelComponent, Component);

module.exports = PanelComponent;


