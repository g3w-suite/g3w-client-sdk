const Validators = require('core/validators/inputs/validators');
const t = require('core/i18n/i18n.service').t;

function Service(options = {}) {
  // set state of input
  this.state = options.state || {};
  // type of input
  const type = this.state.type;
  const validatorOptions = (options.validatorOptions || this.state.input.options) || {};
  // useful for the validator to validate imput
  this._validator = Validators.get(type, validatorOptions);
}

const proto = Service.prototype;

proto.getState = function() {
  return this.state;
};

proto.getValue = function() {
  return this.state.value;
};

proto.setValue = function(value) {
  this.state.value = value;
};

proto.addValueToValues = function(value) {
  this.state.input.options.values.push(value)
};

proto._getValidatorType = function() {
  return this.state.type;
};

proto.setState = function(state) {
  this.state = _.isObject(state) ? state : {};
};

// return validator
proto.getValidator = function() {
  return this._validator;
};

proto.setValidator = function(validator) {
  this._validator = validator;
};

// general method to check the value of the state is valid or not
proto.validate = function() {
  if ((Array.isArray(this.state.value) && this.state.value.length) || !_.isEmpty(_.trim(this.state.value))) {
    this.state.validate.empty = false;
    this.state.validate.valid = this._validator.validate(this.state.value);
  } else {
    this.state.validate.empty = true;
    this.state.validate.valid = !this.state.validate.required;
  }
  return this.state.validate.valid;
};

proto.getErrorMessage = function(type) {
  return t("sdk.form.inputs.input_validation_error") + "("+t("sdk.form.inputs." + type) + ")";
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;
