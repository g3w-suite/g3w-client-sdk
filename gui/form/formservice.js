const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function FormService() {
  this.state = null;
  this.eventBus = new Vue();
  this.setters = {
    setInitForm: function(options) {
      this._setInitForm(options);
    },
    // setter change fields
    setFormFields: function (fields) {
      this.state.fields = fields;
    },
    setupFields: function() {
      this._setupFields();
    },
    // setter sinsert data into form
    setFormData: function(fields) {
      this.setFormFields(fields);
    },
    // setter single field
    setField: function(field) {},
    // settere state
    setState: function(state) {
      this._setState(state);
    },
    // setter add action
    addActionsForForm: function (actions) {},
    // postrender function
    postRender: function (element) {
      // hook for listener to chenge DOM
    }
  };
  // init form options paased for example by editor
  this._setInitForm = function(options) {
    options = options || {};
    this.title = options.title || 'Form';
    this.formId = options.formId;
    this.name = options.name;
    this.pk = options.pk || null;
    this.buttons = options.buttons || [];
    this.state = {
      title: this.title,
      fields: null,
      buttons: this.buttons,
      disabled: false,
      valid: true, // global form validation state. True at beginning
        // when input change will be update
      tovalidate: [] // object array to be validate. They have at list valid key (boolean)
    };
    this.setFormFields(options.fields);
  };
  // Every input send to form it valid value that will change the genaral state of form
  this.isValid = function() {
    this.state.valid = this.state.tovalidate.reduce((valid, tovalidate) => valid && tovalidate.valid, true);
  };

  //add new input to validate
  this.addToValidate = function(validate) {
    this.state.tovalidate.push(validate);
  };

  this.getState = function () {
    return this.state;
  };

  this._setState = function(state) {
    this.state = state;
  };

  //get fields
  this.getFields = function() {
    return this.state.fields;
  };

  this._getField = function(fieldName){
    return this.state.fields.find(field => field.name === fieldName);
  };

  //get form event bus
  this.getEventBus = function() {
    return this.eventBus;
  };

  this.init = function(options) {
    this._setInitForm(options);
  };

  base(this);
}

// Make the public service en Event Emitter
inherit(FormService, G3WObject);

module.exports = FormService;
