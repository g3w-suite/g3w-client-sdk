var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var Service = require('../formservice');
var base = require('core/utils/utils').base;
var Template = require('./form.html');
var HeaderFormComponent = require('../components/header/vue/header');
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
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    changeInput: function(input) {
      //vado ad emettere un chenge input del body input
      this.$options.service.eventBus.$emit('changeinput', input);
      return this.$options.service.isValid();
    },
    addToValidate: function(validate) {
      this.$options.service.addToValidate(validate);
    },
    // funzione che fa il reload del layout
    reloadLayout: function() {
      var height = $(this.$el).height();
      var width = $(this.$el).width();
      // verifico altezza altrimenti esco
      if (!height)
        return;
      var isHeader = false; // verifco elemento is header
      var isFooter = false; // verifico elemento is footer
      var formElement = $(this.$el).find("div[class*=\"g3w-form-component\"]");
      var externalElement = [];
      var centralElements = [];
      var notBodyElementHeight = 0;
      var centralElementsNumber = 0;
      formElement.each(function() {
        isFooter = $(this).hasClass('g3w-form-component_footer');
        if (!isHeader || isFooter) {
          externalElement.push($(this));
          notBodyElementHeight += $(this).height();
        }
        else {
          if (!$(this).hasClass('g3w-form-component_body'))
            centralElements.push($(this));
          centralElementsNumber += 1;
        }
        isHeader = !isHeader ? $(this).hasClass('g3w-form-component_header') : true;
      });
      // vado a calcolare la possibile altezza del body
      var centralHeight = height - (notBodyElementHeight); // altezza dedidcata alla parte centrale del form
      var heightToAppy = (centralHeight/ centralElementsNumber) - 15; // altezza che possono essere assegnate alle varie parti
      // verifico l'altezza del bosy (se settata
      var bodyElementHeight = $(this.$el).find(".g3w-form-component_body .box-primary").outerHeight() + 20; // prendo l'altezza del bosy
      bodyElementHeight =  bodyElementHeight > heightToAppy ? heightToAppy: bodyElementHeight ; // verifico se è maggiore dell'altezza prevsta
      $(this.$el).find(".g3w-form-component_body").height(bodyElementHeight);
      centralHeight = centralHeight - bodyElementHeight; // ricalcolo l'altezza che devo assegnare alle altre parti in base all'altezza del body
      centralElementsNumber-=1; // tolgo un elemento
      heightToAppy = (centralHeight/ centralElementsNumber) - 15;
      _.forEach(centralElements, function(element) {
        element.height(heightToAppy)
      });
      $(".nano").nanoScroller();
    }
  },
  mounted: function() {
    var self = this;
    this.$options.service.getEventBus().$on('addtovalidate', this.addToValidate);
    this.$nextTick(function() {
      this.reloadLayout();
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
  options.components = options.components || [HeaderFormComponent, BodyFormComponent, FooterFormComponent];
  // lancio l'inizializzazione del componente
  this.init(options);

  this.addComponentBeforeBody = function(Component) {
    this.insertComponentAt(1, Component);
  };

  this.addComponentAfterBody = function(Component) {
    this.insertComponentAt(2, Component)
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
    });
  };
  this.layout = function() {
    this.internalComponent.reloadLayout();
  }
}

inherit(FormComponent, Component);

module.exports = FormComponent;

