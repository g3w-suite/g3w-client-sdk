const Validators = require('core/validators/inputs/validators');
const t = require('core/i18n/i18n.service').t;

function Service(options={}) {
  this.state = options.state || {};
  const validatorType = this.state.type;
  this._validatorOptions = options.validatorOptions || this.state.input.options || {};
  this._getValidatorType(this.state);
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
  this.state.value = value;
};

proto.addValueToValues = function(value) {
  this.state.input.options.values.push(value)
};

proto._getValidatorType = function(input) {
  //console.log(input)
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
  return t("form.inputs.input_validation_error") + "("+t("form.inputs." + field_type) + ")";
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;
