const id = require('core/utils/utils').getUniqueDomId();
const GraphLine = {
  props: {
    config: {
      type: Object,
      default: {
        data: {
          columns: [
            ['x'],
            ['y']
          ]
        }
      }
    },
  },
  data() {
    return {
      id: `graphline${id}`
    }
  },
  template: require('./lineXY.html'),
  methods: {},
  mounted() {
    this.$nextTick(() => {
      this.chart = c3.generate({
        bindto: `#${this.id}`,
        ...this.config
      });
    })
  },
  beforeDestroy() {
    this.chart.destroy();
    this.chart = null;
  }
};

module.exports = GraphLine;
