var FooterTemplate = require('./footer.html');
var FooterFormComponent = Vue.extend({
  template: FooterTemplate,
  props: ['state'],
  methods: {
    exec: function(cbk) {
      _.isFunction(cbk) ? cbk(this.state.fields): (function() { return this.state.fields})();
    },
    btnEnabled: function(button) {
      return button.type != 'save' || (button.type == 'save' && this.isValid());
    },
    isValid: function() {
      return this.state.valid
    }
  }
});

module.exports = FooterFormComponent;