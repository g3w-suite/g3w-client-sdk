const Input = require('gui/inputs/input');

const TableInput = Vue.extend({
  mixins: [Input],
  template: require('./table.html'),
  methods: {
    addRow() {
      console.log('addRow')
    }
  }
});

module.exports = TableInput;
