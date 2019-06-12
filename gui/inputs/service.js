const Validators = require('core/validators/inputs/validators');
const t = require('core/i18n/i18n.service').t;

function Service(options = {}) {
  // set state of input
  this.state = options.state || {};
  this.setValue(this.state.value);
  // type of input
  const validatorType = this.state.type;
  this._validatorOptions = options.validatorOptions || this.state.input.options || {};
  // useful for the validator to validate imput
  this._validator = Validators.get(validatorType);
}

const proto = Service.prototype;

proto.getState = function() {
  return this.state;
};

proto.getValue = function() {
  return this.state.value;
};

proto.setValue = function(value) {
  this.state.value = (value !== null && value !== undefined) ? value :
    Array.isArray(this.state.input.options) ? this.state.input.options[0].default: this.state.input.options.default;
};

proto.addValueToValues = function(value) {
  this.state.input.options.values.unshift(value)
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
  if (!_.isEmpty(_.trim(this.state.value))) {
    this.state.validate.valid = this._validator.validate(this.state.value, this._validatorOptions);
  } else {
    this.state.validate.valid = !!!this.state.validate.required;
  }
  this.state.validate.message = this.state.validate.valid ? null : this.getErrorValidateMessage(this.state.type) ;
  return this.state.valid;
};

proto.getErrorValidateMessage = function(field_type) {
  return t("sdk.form.inputs.input_validation_error") + "("+t("sdk.form.inputs." + field_type) + ")";
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;
