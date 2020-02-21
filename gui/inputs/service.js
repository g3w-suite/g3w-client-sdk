const Validators = require('core/validators/inputs/validators');
const t = require('core/i18n/i18n.service').t;

function Service(options = {}) {
  // set state of input
  this.state = options.state || {};
  // type of input
  this.setValue(this.state.value);
  const type = this.state.type;
  const validatorOptions = (options.validatorOptions || this.state.input.options) || {};
  // useful for the validator to validate input
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
  if (value === null || value === undefined) {
    this.state.value = Array.isArray(this.state.input.options) ? this.state.input.options[0].default
      : Array.isArray(this.state.input.options.values) && this.state.input.options.values.length ?
        this.state.input.options.values[0] && this.state.input.options.values[0].value || this.state.input.options.values[0]
        : this.state.input.options.default;
  }
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
  if ((Array.isArray(this.state.value) && this.state.value.length) || !_.isEmpty(_.trim(this.state.value))) {
    this.state.validate.empty = false;
    if (this.state.input.type === 'integer' || this.state.input.type === 'float') {
      if (+this.state.value < 0) {
        this.state.value = null;
        this.state.validate.empty = true;
        this.state.validate.valid = !this.state.validate.required;
      } else
        this.state.validate.valid = this._validator.validate(this.state.value);
    }
    if (this.state.validate.exclude_values && this.state.validate.exclude_values.length) {
        if (this.state.validate.exclude_values.indexOf(this.state.value) !== -1) {
          this.state.validate.valid = false;
          this.state.validate.unique = false;
        } else
          this.state.validate.unique = true;
    } else
      this.state.validate.valid = this._validator.validate(this.state.value);
  } else {
    this.state.validate.empty = true;
    this.state.value = null;
    this.state.validate.unique = true;
    // check if require or check validation
    this.state.validate.valid = this.state.validate.required ? false : this._validator.validate(this.state.value);
  }
  return this.state.validate.valid;
};

proto.getErrorMessage = function(input) {
  if (input.validate.mutually)
    return `${t("sdk.form.inputs.input_validation_mutually_exclusive")} ( ${input.validate.mutually.join(',')} )`;
  else if (input.validate.max_field)
    return `${t("sdk.form.inputs.input_validation_max_field")} (${input.validate.max_field})`;
  else if (input.validate.min_field)
    return `${t("sdk.form.inputs.input_validation_min_field")} (${input.validate.min_field})`;
  else if (!input.validate.unique && input.validate.exclude_values)
    return `${t("sdk.form.inputs.input_validation_exclude_values")}`;
  else if (input.validate.required) {
    let message = `${t("sdk.form.inputs.input_validation_error")} ( ${t("sdk.form.inputs." + input.type)} )`;
    if (this.state.info) {
      message = `${message}
                 <div>
                  <b>${this.state.info}</b>
                 </div>         
      `
    }
    this.state.validate.message = message;
  } else {
    this.state.validate.message = this.state.info;
  }
};

proto.isEditable = function() {
  return this.state.editable;
};

module.exports = Service;
