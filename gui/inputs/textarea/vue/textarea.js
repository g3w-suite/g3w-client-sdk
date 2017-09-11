// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');

var TextAreaInput = Vue.extend({
  mixins: [Input]
});

module.exports = TextAreaInput;