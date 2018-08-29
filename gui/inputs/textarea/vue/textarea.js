// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');

var TextAreaInput = Vue.extend({
  mixins: [Input],
  template: require('./textarea.html')
});

module.exports = TextAreaInput;
