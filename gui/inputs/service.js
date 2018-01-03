const Validators = require('core/validators/inputs/validators');
const t = require('core/i18n/i18n.service').t;

function Service(options) {
  options = options || {};
  this.state = options.state || {};
  const validatorType = this.state.type;
  this._validatorOptions = options.validatorOptions || this.state.input.options || {};
  // serve il validatore per verificare se è valido il valore inserito
  this._validator = Validators.get(validatorType);
}

const proto = Service.prototype;

// rsitutisce lo state
proto.getState = function() {
  return this.state;
};

// setta un eventuale nuovo stato
proto.setState = function(state) {
  this.state = _.isObject(state) ? state : {};
};

// resituisce il validator
proto.getValidator = function() {
  return this._validator;
};

// setta il nuovo validator
proto.setValidator = function(validator) {
  this._validator = validator;
};

// funzione generica che permette di verificare se
// il valore dello state del campo è valido o no
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
