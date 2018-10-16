const layout = require('./utils').layout;
const changeLayout = require('./utils').changeLayoutBottomControl;
const scaleToRes = require('../utils/utils').scaleToRes;
const resToScale = require('../utils/utils').resToScale;
const SCALES = [
  1000000,5000000, 250000, 100000, 50000, 25000, 10000, 5000, 2500, 2000, 1000
];

const ScaleControl = function(options= {}) {
  this.position = options.position || {
    bottom: true,
    right: true
  };
  ol.control.Control.call(this, options);
};

ol.inherits(ScaleControl, ol.control.Control);

module.exports = ScaleControl;
const proto = ScaleControl.prototype;

// called from map when layout change
proto.changelayout = function(map) {
  const position = this.position;
  const element = $(this.element);
  changeLayout({
    map,
    position,
    element
  });
};

proto.layout = function(map) {
  const self = this;
  let isMapResolutionChanged = false;
  let selectedOnClick = false;
  const position = this.position;
  const element = $(this.element);
  layout({
    map,
    position,
    element
  });
  const select2 = element.children('select').select2({
    tags: true,
    width: '120px',
    height: '20px',
    language: {
      noResults: function (params) {
        return "Scala non valida";
      }
    },
    createTag: function (params) {
      let newTag = null;
      let scale;
      // Don't offset to create a tag if there is no @ symbol
      if (params.term.indexOf('1:') !== -1) {
        // Return null to disable tag creation
        scale = params.term.split('1:')[1];
      } else if (Number.isInteger(Number(params.term)))
        scale = Number(params.term);
      if (1*scale <= self.scales[0]) {
        newTag = {
          id: scale,
          text: `1:${params.term}`,
          new: true
        };
        deleteLastCustomScale()
      }
      return newTag
    }
  });

  function deleteLastCustomScale() {
    select2.find('option').each((index, option) => {
      if (self.scales.indexOf(1*option.value) == -1) {
        $(option).remove()
      }
    });
  }

  function addCustomTag (data) {
    if (select2.find("option[value='" + data.id + "']").length) {
      select2.val(data.id).trigger('change')
    } else {
      deleteLastCustomScale();
      const newOption = new Option(data.text, data.id, true, true);
      select2.append(newOption).trigger('change');
    }
  }

  map.on('moveend', function() {
    if (isMapResolutionChanged) {
      const resolution = this.getView().getResolution();
      const scale = parseInt(resToScale(resolution));
      const data = {
        id: scale,
        text: `1:${scale}`,
        new: true
      };
      addCustomTag(data);
      isMapResolutionChanged = false;
    } else {
      selectedOnClick = false;
    }
  });

  map.getView().on('change:resolution', () => {
    isMapResolutionChanged = !selectedOnClick;
  });

  select2.on('select2:select', function (e) {
    selectedOnClick = true;
    const data = e.params.data;
    if (data.new) {
      deleteLastCustomScale();
      addCustomTag(data);
    }
    const scale = 1*data.id;
    const resolution = scaleToRes(scale);
    map.getView().setResolution(resolution);
  });
};

proto._setScales = function(map) {
  const currentScale = parseInt(resToScale(map.getView().getResolution()));
  this.scales = SCALES.filter((scale) => {
    return scale < currentScale;
  });
  this.scales.unshift(currentScale);
  this._createControl();
};

proto._createControl = function() {
  const controlDomElement = document.createElement('div');
  const select = document.createElement('select');
  const optgroup  = document.createElement('optgroup');
  optgroup.label = '';
  this.scales.forEach((scale, index) => {
    const option = document.createElement('option');
    option.value = scale;
    option.text = `1:${scale}`;
    option.selected = index == 0  ? true : false;
    optgroup.appendChild(option);
  });
  const optgroup_custom  = document.createElement('optgroup');
  optgroup_custom.label = 'Custom';
  select.appendChild(optgroup);
  select.appendChild(optgroup_custom);
  controlDomElement.appendChild(select);
  // set element of control (it is necessary to visualize it)
  this.element = controlDomElement;
  $(this.element).addClass('ol-control ol-control-br ol-scale-control');
  $(this.element).css('height', '20px');
};

proto.setMap = function(map) {
  if (map) {
    this._setScales(map);
    this.layout(map);
    ol.control.Control.prototype.setMap.call(this, map);
  }
};





