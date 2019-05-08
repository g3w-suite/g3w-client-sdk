const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function FormService() {
  this.state = null;
  this.eventBus = new Vue();
  this.setters = {
    setInitForm: function (options) {
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
  this.init = function(options={}) {
    this._setInitForm(options);
  };
  // init form options paased for example by editor
  this._setInitForm = function (options = {}) {
    const layer = options.layer;
    const fields = options.fields;
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
      tovalidate: {
        invalids: [],
        inputs: {}
      } // object array to be validate. They have at list valid key (boolean)
    };
    this.setFormFields(fields);
    this.setFormStructure(options.formStructure);
    if (layer && options.formStructure) {
      const fieldsoutofformstructure = layer.getFieldsOutOfFormStructure().map((field) => {
        return field.field_name;
      });
      this.state.fieldsoutofformstructure = {
        fields: fields.filter((field) => {
          return fieldsoutofformstructure.indexOf(field.name) > -1;
        })
      }
    }
  }
}

inherit(FormService, G3WObject);

const proto = FormService.prototype;

proto.setLoading = function(bool=false) {
  this.state.loading = bool;
};

// Every input send to form it valid value that will change the genaral state of form
proto.isValid = function(input) {
  if (input) {
    //check a specific input
    const valid = input.validate.valid;
    if (this.state.tovalidate.invalids.length === 0) {
      !valid && this.state.tovalidate.invalids.push(input.name);
      this.state.valid = valid;
    } else {
      const index = this.state.tovalidate.invalids.indexOf(input.name);
      if (index === -1) {
        !valid && this.state.tovalidate.invalids.push(input.name);
      } else {
        valid && this.state.tovalidate.invalids.splice(index, 1);
      }
    }
  }
  this.state.valid = this.state.tovalidate.invalids.length === 0 ? true: this._checkFormValidationComplete(input);
};

proto._checkFormValidationComplete = function(input) {
  let valid = true;
  const init = !input;
  const checkInputMutuallyValidation = (input) => {
    const isvalidinput = input.validate.valid;
    const isEmpty = input.validate.empty;
    if (input.validate.mutually) {
      let mutuallyValidInput;
      if (isvalidinput) {
        input.validate.mutually.map((inputName) => {
          const mutallyInput = this.state.tovalidate.inputs[inputName];
          mutallyInput.validate.valid = (mutallyInput.validate.valid === false && mutallyInput.validate.empty) ? undefined: mutallyInput.validate.valid;
        });
        valid = !input.validate.mutually.find((inputName) => {
          return this.state.tovalidate.inputs[inputName].validate.valid === false;
        });
      } else {
        if (!init) {
          mutuallyValidInput = !!input.validate.mutually.find((inputName) => {
            return this.state.tovalidate.inputs[inputName].validate.valid;
          });
          input.validate.mutually.map((inputName) => {
            const mutallyInput = this.state.tovalidate.inputs[inputName];
            mutallyInput.validate.valid = (!mutuallyValidInput && mutallyInput.validate.valid === undefined) ? false: mutallyInput.validate.valid;
          });
        }
        mutuallyValidInput = !!input.validate.mutually.find((inputName) => {
          return this.state.tovalidate.inputs[inputName].validate.valid;
        });
        input.validate.valid =  mutuallyValidInput && isEmpty ? undefined: isvalidinput;
        valid = input.validate.valid || (input.validate.valid === undefined && mutuallyValidInput);
      }
    } else
      valid = isvalidinput || input.validate.valid === undefined
  };
  if (input)
    checkInputMutuallyValidation(input);
  else {
    const invalidInputs = this.state.tovalidate.invalids;
    for (let i = invalidInputs.length; i--;) {
      const inputName = invalidInputs[i];
      const input = this.state.tovalidate.inputs[inputName];
      checkInputMutuallyValidation(input);
    }
  }
  return valid;
};

proto.addComponents = function(components = []) {
  for (const component of components) {
    this.addComponent(component);
  }
};

proto.addComponent = function(component) {
  const {id:title, icon} = component;
  this.state.headers.push({title, icon});
  this.state.components.push(component.component);
};

proto.setComponent = function(component) {
  this.state.component = component;
};

proto.addedComponentTo = function(formcomponent = 'body') {
  this.state.addedcomponentto[formcomponent] = true;
};

proto.addToValidate = function(input) {
  this.state.tovalidate.inputs[input.name] = input;
  input.validate.valid === false && this.state.tovalidate.invalids.push(input.name);
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
