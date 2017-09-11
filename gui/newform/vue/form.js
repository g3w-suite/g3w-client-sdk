var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var Service = require('../formservice');
var base = require('core/utils/utils').base;
var Template = require('./form.html');
var BodyFormComponent = require('../components/body/vue/body');
var FooterFormComponent = require('../components/footer/vue/footer');


//Definisco l'oggetto che contiene i dati necessari per instanziare un vue component
var vueComponentObject = {
  template: null,
  data: function() {
    return {
      state: null
    }
  },
  components: {},
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    isValid: function() {
      return this.$options.service.isValid();
    },
    registerInput: function (input) {
      // registra lo stato di validazione, oggetto, dell'input appena inserito
      this.$options.service.unregisterInput(input);
    },
    unregisterInput: function (input) {
      this.$options.service.unregisterInput(input);
    },
    addToValidate: function(validate) {
      this.$options.service.addToValidate(validate);
    }
  },  
  computed: {
  },
  mounted: function() {
    var self = this;
    this.$nextTick(function() {
      self.$options.service.postRender();
    });
  }
};

function FormComponent(options) {
  options = options || {};
  // vado a settare il'id del componente
  options.id = options.id || 'form';
  // qui vado a tenere traccia delle tre cose che mi permettono di customizzare
  // vue component, service e template
  // proprietà necessarie. In futuro le mettermo in una classe Panel
  // da cui deriveranno tutti i pannelli che vogliono essere mostrati nella sidebar
  base(this, options);
  //settor il service del component (lo istanzio tutte le volte che inizializzo un componente
  options.service = options.service ?  new options.service : new Service;
  options.vueComponentObject = options.vueComponentObject  || vueComponentObject;
  options.template = options.template || Template;
  // qui vado a settare i componenti del form altrimenti setto quelli standard
  options.components = options.components || [BodyFormComponent, FooterFormComponent];
  // lancio l'inizializzazione del componente
  this.init(options);

  this.addComponentBeforeBody = function(Component) {
    this.insertComponentAt(0, Component);
  };

  this.addComponentAfterBody = function(Component) {
    this.insertComponentAt(1, Component)
  };

  this.addComponentBeforeFooter = function() {
   //TODO
  };

  this.addComponentAfterFooter = function(Component) {
    //TODO
  };
  // Sovrascrivo il metodo mount padre. Viene richiamato dalla toolbar quando
  // il plugin chiede di mostrare un proprio pannello nella GUI (GUI.showPanel)
  this.mount = function(parent, append) {
    var self = this;
    // richiama il mont padre
    return base(this, 'mount', parent, append)
      // una volta footo il mount
    .then(function() {
      // setto il modale a true
      GUI.setModal(true);
      //vado a validare subito il form
      self.getService().isValid();
      // lacio il layout
      self.layout();
    });

  };
  // funzione che viene chiamata ad ogni ridimensionamento dell'elelemnto padre
  this.layout = function(width,height) {
    var notBodyElement = $(this.internalComponent.$el).find("div[class*=\"g3w-form-component\"]");
    var notBodyElementHeight = 0;
    notBodyElement.each(function() {
      notBodyElementHeight +=  $(this).height();
    });
    var bodyHeight = height - (notBodyElementHeight + 10);
    var bodyElementHeight = $(this.internalComponent.$el).find(".g3w-form-component_body").height();
    bodyHeight = (!bodyElementHeight || bodyElementHeight > bodyHeight) ? bodyHeight: bodyElementHeight +10;
    $(this.internalComponent.$el).find(".g3w-form-component_body").css({'max-height': bodyHeight});
    $(".nano").nanoScroller();
  }
}

inherit(FormComponent, Component);

module.exports = FormComponent;

