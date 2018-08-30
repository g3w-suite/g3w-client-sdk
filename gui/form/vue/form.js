const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const Component = require('gui/vue/component');
const Service = require('../formservice');
const base = require('core/utils/utils').base;
const Template = require('./form.html');
const HeaderFormComponent = require('../components/header/vue/header');
const BodyFormComponent = require('../components/body/vue/body');
const FooterFormComponent = require('../components/footer/vue/footer');


//vue component
const vueComponentObject = {
  template: null,
  data: function() {
    return {
      state: {}
    }
  },
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    changeInput: function(input) {
      //emit change input of body input
      this.$options.service.eventBus.$emit('changeinput', input);
      return this.$options.service.isValid();
    },
    addToValidate: function(validate) {
      this.$options.service.addToValidate(validate);
    },
    // relaod layout
    reloadLayout: function() {
      const height = $(this.$el).height();
      const width = $(this.$el).width();
      // check height
      if (!height)
        return;
      let isHeader = false; // is header
      let isFooter = false; // is footer
      let notBodyElementHeight = 0;
      let centralElementsNumber = 0;
      const formElement = $(this.$el).find("div[class*=\"g3w-form-component\"]");
      const externalElement = [];
      const centralElements = [];
      formElement.each(function() {
        isFooter = $(this).hasClass('g3w-form-component_footer');
        if (!isHeader || isFooter) {
          externalElement.push($(this));
          notBodyElementHeight += $(this).height();
        } else {
          if (!$(this).hasClass('g3w-form-component_body'))
            centralElements.push($(this));
          centralElementsNumber += 1;
        }
        isHeader = !isHeader ? $(this).hasClass('g3w-form-component_header') : true;
      });
      // calculate heigth body
      let centralHeight = height - (notBodyElementHeight); // central form dom
      let heightToAppy = (centralHeight/ centralElementsNumber) - 15; // height of others part
      // check height of the body
      if (this.state.addedcomponent.body) {
        let bodyElementHeight = $(this.$el).find(".g3w-form-component_body .box-primary").outerHeight() + 20;
        bodyElementHeight =  bodyElementHeight > heightToAppy ? heightToAppy: bodyElementHeight ;
        $(this.$el).find(".g3w-form-component_body").height(bodyElementHeight);
        centralHeight = centralHeight - bodyElementHeight;
        centralElementsNumber-=1;
        heightToAppy = (centralHeight/ centralElementsNumber) - 15;
        centralElements.forEach((element) => {
          element.height(heightToAppy)
        });
      } else {
        $(this.$el).find(".g3w-form-component_body").height(height - notBodyElementHeight);
      }
      $(".nano").nanoScroller();
    }
  },
  created() {},
  mounted: function() {
    this.$options.service.getEventBus().$on('addtovalidate', this.addToValidate);
    this.$options.service.getEventBus().$on('addedcomponents', () => {
      this.state.addedcomponent.body = true;
    });
    this.$nextTick(() => {
      this.reloadLayout();
      this.$options.service.postRender();
    });
  }
};

function FormComponent(options = {}) {
  options.id = options.id || 'form';
  // qui vado a tenere traccia delle tre cose che mi permettono di customizzare
  base(this, options);
  options.service = options.service ?  new options.service : new Service;
  options.vueComponentObject = options.vueComponentObject  || vueComponentObject;
  options.template = options.template || Template;
  //set statdar element of the form
  options.components = options.components || [HeaderFormComponent, BodyFormComponent, FooterFormComponent];
  this.init(options);

  this.addComponentBeforeBody = function(Component) {
    this.getService().getEventBus().$emit('addedcomponenttobody');
    this.insertComponentAt(1, Component);
  };

  this.addComponentAfterBody = function(Component) {
    this.getService().getEventBus().$emit('addedcomponenttobody');
    this.insertComponentAt(2, Component)
  };

  this.addComponentBeforeFooter = function() {
   //TODO
  };

  this.addComponentAfterFooter = function(Component) {
    //TODO
  };
  // overwrite father mount method.
  this.mount = function(parent, append) {
    return base(this, 'mount', parent, append)
    .then(() => {
      // set modal window to true
      GUI.setModal(true);
      //checkform validation
      this.getService().isValid();
    });
  };
  this.layout = function() {
    this.internalComponent.reloadLayout();
  }
}

inherit(FormComponent, Component);

module.exports = FormComponent;

