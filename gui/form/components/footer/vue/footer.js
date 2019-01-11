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
    },
    _enterEventHandler(evt) {
      evt.preventDefault();
      if (evt.which === 13 && this.isValid()) {
        $(this.$el).find('button').click();
      }
    }
  },
  data() {
    return {
      id:"footer"
    }
  },
  mounted() {
    this.$nextTick(() => {
      document.addEventListener('keyup', this._enterEventHandler)
    })
  },
  beforeDestroy() {
    document.removeEventListener('keyup', this._enterEventHandler)
  }
});

module.exports = FooterFormComponent;
