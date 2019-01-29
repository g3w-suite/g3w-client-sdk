const id = require('core/utils/utils').getUniqueDomId();
const GraphLine = {
  props:{
    data: {
      type: Array,
      default: []
    },
    click: {
      type: Function,
      default: function(){}
    },
    axis: {
      type: Object,
      default: {
        x: {
          label: '',
          value: []
        },
        y: {
          label: '',
          values: []
        }
      }
    }
  },
  data() {
    return {
      id: `graphline${id}`
    }
  },
  template: require('./line.html'),
  methods: {},
  mounted() {
    this.$nextTick(()=> {
      this.chart = c3.generate({
        bindto: `#${this.id}`,
        data: {
          columns: [
            this.data
          ],
          onclick: this.click
        },
        axis: {
          x: this.axis.x,
          y: this.axis.y,
        }
      });
    })
  },
  beforeDestroy() {
    this.chart.destroy();
    this.chart = null;
  }
};

module.exports = GraphLine;
