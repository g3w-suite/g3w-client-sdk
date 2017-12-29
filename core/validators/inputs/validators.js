const validators = {
  integer: require('./integer'),
  checkbox: require('./checkbox'),
  datetimepicker: require('./datetimepicker'),
  text: require('./validator'),
  string: require('./validator'),
  default: require('./validator'),
};

const Validators = {
  get: function(type) {
    const Validator = validators[type] || validators.default;
    return new Validator;
  }

};

module.exports = Validators;
