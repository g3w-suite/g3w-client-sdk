const HeaderFormComponent = Vue.extend({
  template: require('./header.html'),
  props: ['titles'],
  data() {
    return {
      currentindex: 0
    }
  },
  methods: {
    click(index) {
      if (this.currentindex !== index){
        this.$emit('clickheader', index);
        this.currentindex = index;
      }
    }
  }
});

module.exports = HeaderFormComponent;
