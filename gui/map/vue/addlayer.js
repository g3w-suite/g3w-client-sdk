const Projections = require('g3w-ol3/src/projection/projections');
const EPSG = [
  "EPSG:3003",
  "EPSG:3004",
  "EPSG:3045",
  "EPSG:3857",
  "EPSG:4326",
  "EPSG:6708",
  "EPSG:23033",
  "EPSG:25833",
  "EPSG:32633"
];

Projections.get("EPSG:3003", "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs");
Projections.get("EPSG:3045", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
Projections.get("EPSG:6708", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
Projections.get("EPSG:32633", "+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
Projections.get("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs");
Projections.get("EPSG:23033", "+proj=utm +zone=33 +ellps=intl +units=m +no_defs");
Projections.get("EPSG:3004", "+proj=tmerc +lat_0=0 +lon_0=15 +k=0.9996 +x_0=2520000 +y_0=0 +ellps=intl +units=m +no_defs");


//Vue color componet
const ChromeComponent = VueColor.Chrome;
ChromeComponent.mounted =  function() {
  this.$nextTick(function() {
    // remove all the tihing that aren't useful
    $('.vue-color__chrome__toggle-btn').remove();
    $('.vue-color__editable-input__label').remove();
    $('.vue-color__chrome__saturation-wrap').css('padding-bottom','100px');
    $('.vue-color__chrome').css({
      'box-shadow': '0 0 0 0',
      'border': '1px solid #97A1A8'
    });
  });
};

const AddLayerComponent = {
  template: require('./addlayer.html'),
  props: ['service'],
  data: function() {
    return {
      options: EPSG,
      layer: {
        name: null,
        type: null,
        crs: null,
        color: {
          hex: '#194d33',
          rgba: {
            r: 25,
            g: 77,
            b: 51,
            a: 1
          },
          a: 1
        },
        data: null,
        visible: true,
        title: null,
        id: null,
        external: true
      }
    }
  },
  components: {
    'chrome-picker': ChromeComponent
  },
  created: function() {
    this.layer.crs = this.service.getCrs();
    this.service.on('addexternallayer', () => {
      $('#modal-addlayer').modal('show');
    });
  },
  methods: {
    onChangeColor: function(val) {
      this.layer.color = val;
    },
    onAddLayer: function(evt) {
      const reader = new FileReader();
      const name = evt.target.files[0].name;
      this.layer.name = name;
      this.layer.title = name;
      this.layer.id = name;
      const type = evt.target.files[0].name.split('.');
      this.layer.type = type[type.length-1].toLowerCase();
      if (this.layer.type == 'zip') {
        this.layer.data = evt.target.files[0];
        $('input:file').val(null);
      } else {
        reader.onload = (evt) => {
          this.layer.data = evt.target.result;
          $('input:file').val(null);
        };
        reader.readAsText(evt.target.files[0]);
      }
    },
    addLayer: function() {
      if (this.layer.name) {
        const layer = _.cloneDeep(this.layer);
        this.service.addExternalLayer(layer);
        $('#modal-addlayer').modal('hide');
        this.clearLayer();
      }
    },
    clearLayer: function() {
      this.layer.name = null;
      this.layer.title = null;
      this.layer.id = null;
      this.layer.type = null;
      this.layer.crs = this.service.getCrs();
      this.layer.color = {
        hex: '#194d33',
        rgba: {
          r: 25,
          g: 77,
          b: 51,
          a: 1
        },
        a: 1
      };
      this.layer.data = null;
    }
  }
};

module.exports = AddLayerComponent;
