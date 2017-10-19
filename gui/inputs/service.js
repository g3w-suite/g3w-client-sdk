var Validator = require('./validator');
var t = require('core/i18n/i18n.service').t;
function Service(options) {
  options = options || {};
  this.state = options.state || {};
  this._validatorOptions = options.validatorOptions || {};
  // serve il validatore per verificare se è valido il valore inserito
  this._validator = options.validator || new Validator;
}

var proto = Service.prototype;

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
  if (!_.isEmpty(_.trim(this.state.value)))
    this.state.validate.valid = this._validator.validate(this.state.value, this._validatorOptions);
  else
      this.state.validate.valid = !!!this.state.validate.required;
  this.state.validate.message = this.state.validate.valid ? null : t("input_validation_error")  ;
  return this.state.valid;
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;