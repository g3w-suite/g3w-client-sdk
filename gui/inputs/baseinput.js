// Base object that has common  inputs methods
const Service = require('./service');

const BaseInput = {
  props: ['state'],
  data: function() {
    return {
      service: new Service({
        state: this.state
      })
    }
  },
  template: require('./baseinput.html'),
  methods: {
    // called when input value chage
    change: function(options) {
      // validsate input
      this.service.validate(options);
      // emit change input
      this.$emit('changeinput', this.state);
    },
    isEditable: function() {
      return this.service.isEditable();
    },
    isVisible: function() {}
  },
  created() {
    Vue.set(this.state.validate, 'valid', true);
    Vue.set(this.state.validate, 'message', null);
  },
  mounted: function() {
    this.change();
    this.$nextTick(() => {
      this.$emit('addinput', this.state);
    })
  }
};

const BaseInputComponent = Vue.extend({
  mixins: [BaseInput]
});


module.exports = {
  BaseInput: BaseInput,
  BaseInputComponent: BaseInputComponent
};
