const id = require('core/utils/utils').getUniqueDomId();
const C3XYLine = {
  template: require('./lineXY.html'),
  props: {
    showdata: {
      type: Boolean,
      default: true
    },
    components: {
      type: Array,
      default: []
    },
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
      id: `graphline${id}`,
      selectitems: [],
      data: [],
      size: {
        width: 0,
        height: 0
      }
    }
  },
  methods: {
    setDataOffset(offset, render=false) {
      const data = this.getData();
      for (let i =0; i < data.length; i++) {
        const item = data[i];
        item.value+=offset;
      }
      if (render) {
        this.resize();
      }
    },
    getSelectedItems() {
      return this.selectitems;
    },
    selectItem(id) {
      this.chart.select(['y'], [id]);
    },
    unselectItem(id) {
      this.chart.unselect(['y'], [id]);
    },
    selectItems(ids=[]) {
      this.chart.select([y], ids);
    },
    unselectItems(ids=[]) {
      this.chart.unselect(['y'], ids);
    },
    unselectAll(){
      this.chart.unselect();
    },
    selectAll() {
      this.chart.select();
    },
    getData() {
      return this.data;
    },
    resize({width, height}={}) {
      this.chart.resize({
        width: width,
        height: height || $(`#${this.id}`).height() - 4
      });
    },
    _setAllowedSpace() {
      if (this.components && this.components.length)
        this.size.height =  document.querySelector('.g3wform_content').offsetHeight -
          this.$el.offsetHeight -
          document.querySelector('.g3wform_header').offsetHeight - 50;
    },
    _setMaxMin({value, max, min}) {
      min = value ? +value : +min;
      max = value ? +value : +max;
      if (min < this.chart.axis.min().y)
        this.chart.axis.min(min);
      else if (max > this.chart.axis.max().y)
        this.chart.axis.max(max);
      else {
        const dataValues = this.data.map(data => +data.value);
        this.chart.axis.max(Math.max(...dataValues));
        this.chart.axis.min(Math.min(...dataValues));

      }
      this.resize();

    },
    changeItems(items) {
      if (items.length === 1)
        this._setMaxMin(items[0].value);
      else {
        const max = Math.max(...items.map(item => +item.value));
        const min = Math.min(...items.map(item => +item.value));
        this._setMaxMin({
          max,
          min
        })
      }
      this.resize();
    },
    changeItem({item, render=true}) {
      const value = item.value;
      this._setMaxMin({value});
      if (render) {
        this.resize();
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      const self = this;
      this.config.data.onselected = function(evt) {
        const _temp = [...self.selectitems, evt];
        self.selectitems = _temp;
      };
      this.config.data.onunselected = function(evt){
        self.selectitems = self.selectitems.filter((selectitem) => {
          return selectitem.index !== evt.index
        });
      };
      this.chart = c3.generate({
        bindto: `#${this.id}`,
        ...this.config,
      });
      const data = this.chart.data()[0] ? this.chart.data()[0].values : [];
      data.forEach((item) => {this.data.push(item)});
      this._setAllowedSpace();
    })
  },
  beforeDestroy() {
    this.data = this.selectitems = null;
    this.chart.destroy();
    this.chart = null;
  }
};

module.exports = C3XYLine;
