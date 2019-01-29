// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');

var TextInput = Vue.extend({
  mixins: [Input]
});

module.exports = TextInput;
