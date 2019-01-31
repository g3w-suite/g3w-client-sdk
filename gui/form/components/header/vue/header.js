const HeaderFormComponent = Vue.extend({
  template: require('./header.html'),
  props: {
    titles: {
      type: Array,
      default:[]
    },
    currentindex: {
      type: Number,
      default:0
    }
  },
  methods: {
    click(index) {
      if (this.currentindex !== index){
        this.$emit('clickheader', index);
      }
    }
  }
});

module.exports = HeaderFormComponent;
