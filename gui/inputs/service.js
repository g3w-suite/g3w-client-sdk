var Validator = require('./validator');
function Service(options) {
  options = options || {};
  /*
    quello che viene da ogni campo sarà un ogetto come questo
    {
      editable: true,
      input: {
        type: "text",
        options: {}
      }
      options: {},
      type: "text",
      label: "gid",
      name: "gid",
      type: "integer",
      validate: {}
    }
   */
  this.state = options.state || {};
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
    this.state.validate.valid = this._validator.validate(this.state.value);
  else
      this.state.validate.valid = !!!this.state.validate.required;
  this.state.validate.message = this.state.validate.valid ? null : "Campo obbligatorio o valore non corretto";
  return this.state.valid;
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;