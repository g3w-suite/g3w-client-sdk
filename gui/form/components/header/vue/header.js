const HeaderFormComponent = Vue.extend({
  template: require('./header.html'),
  props: ['state'],
  data() {
    return {
      id:"header"
    }
  }
});

module.exports = HeaderFormComponent;
