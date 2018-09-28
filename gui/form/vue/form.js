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
      state: {},
      split: {
        show: !this.isMobile(),
        resized: false
      }
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
    // set layout
    reloadLayout: function() {
      if ((!this.split.show || !this.split.resize)) {
        const height = $(this.$el).height();
        //const width = $(this.$el).width();
        // check height
        if(!height)
          return;
        let isHeader = false; // is header
        let isFooter = false; // is footer
        let notBodyElementHeight = 0;
        let centralElementsNumber = 0;
        const formElement = $(this.$el).find("div[class*=\"g3w-form-component\"]");
        const externalElement = [];
        const centralElements = [];
        formElement.each(function () {
          isFooter = $(this).attr('id') === 'g3wform_footer';
          if(!isHeader || isFooter) {
            externalElement.push($(this));
            notBodyElementHeight += $(this).height();
          } else {
            if($(this).attr('id') !== 'g3wform_body') {
              centralElements.push($(this));
              centralElementsNumber += 1;
            }
          }
          isHeader = !isHeader ? $(this).attr('id') === 'g3wform_header' : true;
        });
        // calculate heigth body
        let centralHeight = height - (notBodyElementHeight); // central form dom
        // assign 70% of the space to body element
        let bodyHeight = bodyElementHeight = centralHeight * 0.70;
        let heightToApply = ((centralHeight - bodyHeight) / centralElementsNumber) - 15; // height of others part
        // check height of the body
        if(this.state.addedcomponentto.body) {
          $(this.$el).find("#g3wform_body").height(bodyElementHeight);
          centralHeight = centralHeight - bodyElementHeight;
          heightToApply = (centralHeight / centralElementsNumber) - 15;
          centralElements.forEach((element) => {
            element.height(heightToApply)
          });
        } else {
          // only body element feature
          $(this.$el).find("#g3wform_body").height(height - notBodyElementHeight);
        }
        this.split.resize = this.split.show ? true : false;
      }
    }
  },
  mounted: function() {
    this.$options.service.getEventBus().$on('addtovalidate', this.addToValidate);
    this.$nextTick(() => {
      if (this.state.addedcomponentto.body && this.split.show) {
        Split(['#g3wform_body', '#g3wform_relations'], {
          direction: 'vertical',
          elementStyle: (dimension, size) => {
            return { 'height': 'calc(' + size + '% - ' + 80 + 'px)' }
          },
        })
      }
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
  options.components = options.components || [
    {id: 'header', component: HeaderFormComponent},
    {id: 'body', component: BodyFormComponent},
    {id: 'footer', component: FooterFormComponent}
  ];
  // initialize component
  this.init(options);
  // some utilities methods
  this.addRelations = function(relations) {
    console.log(relations)
  };
  this.addComponentBeforeBody = function(Component) {
    this.getService().addedComponentTo('body');
    this.insertComponentAt(1, Component);
  };

  this.addComponentAfterBody = function(Component) {
    this.getService().addedComponentTo('body');
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
  };

}

inherit(FormComponent, Component);

module.exports = FormComponent;

