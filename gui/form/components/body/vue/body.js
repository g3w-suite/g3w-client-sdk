var BodyTemplate = require('./body.html');
var Inputs = require('gui/inputs/inputs');

var BodyFormComponent = Vue.extend({
  template: BodyTemplate,
  props: ['state'],
  components: Inputs,
  methods: {
    addToValidate: function(input) {
      // aggiunge l'input da validare
      this.$emit('addtovalidate', input.validate);
    },
    changeInput: function(input) {
      this.$emit('changeinput', input);
    },
    reloadLayout: function(index) {
      if (index == this.state.fields.length - 1) {
        this.$emit('reloadlayout');
      }
      return true
    },
    datetimepickerShow: function() {
      var element = $(this.$el);
      var top = element.offset().top;
      var left = element.offset().left;
      var width = element.width();
      $('.bootstrap-datetimepicker-widget').css({
        'position': 'fixed',
        'left': left+'px',
        'top': top+'px',
        'width': width+'px',
      });
      $(".nano").nanoScroller();
    }
  },
  mounted: function() {
    
  }
});

module.exports = BodyFormComponent;