const FooterTemplate = require('./footer.html');
const FooterFormComponent = Vue.extend({
  template: FooterTemplate,
  props: ['state'],
  methods: {
    exec: function(cbk) {
      cbk instanceof Function ? cbk(this.state.fields): (function() { return this.state.fields})();
    },
    btnEnabled: function(button) {
      return button.type != 'save' || (button.type == 'save' && this.isValid());
    },
    isValid: function() {
      return this.state.valid
    }
  },
  data() {
    return {
      id:"footer"
    }
  }
});

module.exports = FooterFormComponent;
