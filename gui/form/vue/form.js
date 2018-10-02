const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const Component = require('gui/vue/component');
const Service = require('../formservice');
const base = require('core/utils/utils').base;
const Template = require('./form.html');
const HeaderFormComponent = require('../components/header/vue/header');
const BodyFormComponent = require('../components/body/vue/body');

//vue component
const vueComponentObject = {
  template: null,
  data: function() {
    return {
      state: {}
    }
  },
  components: {
    g3wformheader: HeaderFormComponent
  },
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    switchComponent(index) {
      this.$options.service.setComponent(this.state.components[index])
    },
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
      const height = $(this.$el).height();
      if(!height)
        return;
      $(this.$el).find(".g3wform_body").height(height - ($('.g3wform_header').height() +  $('.g3wform_footer').height()) - 50);
    }
  },
  mounted: function() {
    this.$options.service.getEventBus().$on('addtovalidate', this.addToValidate);
    this.$nextTick(() => {
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
  const components = options.components || [
    {id: options.title, component: BodyFormComponent}
  ];
  // initialize component
  this.init(options);

  this.getService().addComponents(components);
  this.getService().setComponent(components[0].component);

  this.addFormComponents = function(components = []) {
    this.getService().addComponents(components);
  };
  // some utilities methods
  this.addDependecyComponents = function(components) {
    this.getService().addDependecyComponents(components)
  };
  this.addComponentBeforeBody = function(Component) {
    //this.getService().addedComponentTo('body');
    //this.insertComponentAt(1, Component);
  };

  this.addComponentAfterBody = function(Component) {
    //this.getService().addedComponentTo('body');
    //this.insertComponentAt(2, Component)
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

