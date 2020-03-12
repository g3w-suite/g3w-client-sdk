const layout = require('./utils').layout;
const changeLayout = require('./utils').changeLayoutBottomControl;
const MousePositionControl = function(options= {}) {
  this.position = options.position || {
    bottom: true,
    right: true
  };
  ol.control.MousePosition.call(this, options);
};

ol.inherits(MousePositionControl, ol.control.MousePosition);

module.exports = MousePositionControl;

const proto = MousePositionControl.prototype;

proto.offline = true;

proto.changelayout = function(map) {
  const position = this.position;
  const element = $(this.element);
  changeLayout({
    map,
    position,
    element
  });
};

proto.setEnable = function(bool) {
  bool ? $(this.element) : $(this.element)
};

proto.layout = function(map) {
  const position = this.position;
  const element = $(this.element);
  layout({
    map,
    position,
    element
  });
  element.addClass('ol-control-br')
};

proto.setMap = function(map) {
  if (map) {
    this.layout(map);
    ol.control.MousePosition.prototype.setMap.call(this, map);
  }
};




