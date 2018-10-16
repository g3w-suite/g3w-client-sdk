const Validators = {
  validators: {
    integer: require('./integer'),
    checkbox: require('./checkbox'),
    datetimepicker: require('./datetimepicker'),
    text: require('./validator'),
    string: require('./validator'),
    default: require('./validator'),
  },

  get(type) {
    const Validator = this.validators[type] || this.validators.default;
    return new Validator;
  }

};

module.exports = Validators;
