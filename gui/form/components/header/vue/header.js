const HeaderFormComponent = Vue.extend({
  template: require('./header.html'),
  props: ['titles', 'currentindex'],
  methods: {
    click(index) {
      if (this.currentindex !== index){
        this.$emit('clickheader', index);
      }
    }
  }
});

module.exports = HeaderFormComponent;
