const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function FormService() {
  this.state = null;
  this.eventBus = new Vue();
  this.setters = {
    setInitForm: function (options) {
      console.log(options)
      this._setInitForm(options);
    },
    setFormStructure: function (formStructure) {
      this.state.formstructure = formStructure;
    },
    // setter change fields
    setFormFields: function (fields) {
      this.state.fields = fields;
    },
    setupFields: function () {
      this._setupFields();
    },
    // setter sinsert data into form
    setFormData: function (fields) {
      this.setFormFields(fields);
    },
    // setter single field
    setField: function (field) {
    },
    // settere state
    setState: function (state) {
      this._setState(state);
    },
    // setter add action
    addActionsForForm: function (actions) {
    },
    postRender: function (element) {
      // hook for listener to chenge DOM
    }
  };
  base(this);
  this.init = function(options) {
    this._setInitForm(options);
  };
  // init form options paased for example by editor
  this._setInitForm = function (options = {}) {
    this.title = options.title || 'Form';
    this.formId = options.formId;
    this.name = options.name;
    this.pk = options.pk || null;
    this.buttons = options.buttons || [];
    this.context_inputs = options.context_inputs;
    this.state = {
      loading:false,
      components: [],
      component: null,
      headers: [],
      currentheaderindex: 0,
      fields: null,
      buttons: this.buttons,
      disabled: false,
      valid: true, // global form validation state. True at beginning
      // when input change will be update
      tovalidate: [], // object array to be validate. They have at list valid key (boolean)
    };
    this.setFormFields(options.fields);
    this.setFormStructure(options.formStructure);
  };
}

inherit(FormService, G3WObject);

const proto = FormService.prototype;

proto.setLoading = function(bool=false) {
  this.state.loading = bool;
};

// Every input send to form it valid value that will change the genaral state of form
proto.isValid = function() {
  let bool = true;
  this.state.tovalidate.forEach((tovalidate) => {
    if (tovalidate && !tovalidate.valid) {
      bool = false;
      return false;
    }
  });
  this.state.valid = bool;
};

proto.addComponents = function(components = []) {
  for (const component of components) {
    this.addComponent(component);
  }
};

proto.addComponent = function(component) {
  this.state.headers.push(component.id);
  this.state.components.push(component.component);
};

proto.setComponent = function(component) {
  this.state.component = component;
};

proto.addedComponentTo = function(formcomponent = 'body') {
  this.state.addedcomponentto[formcomponent] = true;
};

proto.addToValidate = function(validate) {
  this.state.tovalidate.push(validate);
};

proto.getState = function () {
  return this.state;
};

proto._setState = function(state) {
  this.state = state;
};

proto.getFields = function() {
  return this.state.fields;
};

proto._getField = function(fieldName){
  const field = this.state.fields.find((field) => {
    return field.name === fieldName
  });
  return field;
};

proto.getEventBus = function() {
  return this.eventBus;
};


proto.setIndexHeader = function(index) {
  this.state.currentheaderindex = index;
};

proto.getContext = function() {
  return this.context_inputs.context;
};

proto.getSession = function() {
  return this.getContext().session;
};

proto.getInputs = function() {
  return this.context_inputs.inputs;
};


module.exports = FormService;
