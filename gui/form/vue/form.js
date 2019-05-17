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
      this.$options.service.setIndexHeader(index);
      this.$options.service.setComponent(this.state.components[index]);
    },
    changeInput: function(input) {
      return this.$options.service.isValid(input);
    },
    addToValidate: function(input) {
      this.$options.service.addToValidate(input);
    },
    // set layout
    reloadLayout: function() {
      const height = $(this.$el).height();
      if(!height)
        return;
      const footerHeight = $('.g3wform_footer').height() ? $('.g3wform_footer').height() + 50 : 50;
      $(this.$el).find(".g3wform_body").height(height - ($('.g3wform_header').height() +  footerHeight));
    },
  },
  created() {
    this.$options.service.getEventBus().$on('set-main-component', () => {
      this.switchComponent(0);
    });
    this.$options.service.getEventBus().$on('addtovalidate', this.addToValidate);
  },
  mounted() {
    this.$options.service.isValid();
  },
  beforeDestroy() {
    this.$options.service.getEventBus().$off('addtovalidate');
    this.$options.service.getEventBus().$off('set-main-component');
  }
};

function FormComponent(options = {}) {
  options.id = options.id || 'form';
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
    });
  };

  this.layout = function() {
    this.internalComponent.reloadLayout();
  };

}

inherit(FormComponent, Component);

module.exports = FormComponent;

