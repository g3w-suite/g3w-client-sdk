const layout = require('./utils').layout;
const Control = function(options) {
  const name = options.name || "?";
  this.name = name.split(' ').join('-').toLowerCase();
  this.id = this.name+'_'+(Math.floor(Math.random() * 1000000));
  /*
    tl: top-left
    tr: top-right
    bl: bottom-left
    bt: bottom-right
   */
  this.positionCode = options.position || 'tl';
  this.priority = options.priority || 0;
  if (!options.element) {
    const className = "ol-"+this.name.split(' ').join('-').toLowerCase();
    const tipLabel = options.tipLabel || this.name;
    const label = options.label || "?";
    options.element = $('<div class="'+className+' ol-unselectable ol-control"><button type="button" title="'+tipLabel+'">'+label+'</button></div>')[0];
  }
  $(options.element).addClass("ol-control-"+this.positionCode);
  const buttonClickHandler = options.buttonClickHandler || Control.prototype._handleClick.bind(this);
  $(options.element).on('click',buttonClickHandler);
  ol.control.Control.call(this, options);
  this._postRender();
};

// sotto classse della classe Control di OL3
ol.inherits(Control, ol.control.Control);

const proto = Control.prototype;

proto.getPosition = function(positionCode) {
  positionCode = positionCode || this.positionCode;
  const position = {};
  position['top'] = (positionCode.indexOf('t') > -1) ? true : false;
  position['left'] = (positionCode.indexOf('l') > -1) ? true : false;
  position ['bottom'] = (positionCode.indexOf('b') > -1) ? true : false;
  position ['right'] = (positionCode.indexOf('r') > -1) ? true : false;
  return position;
};

proto._handleClick = function(event) {
  event.preventDefault();
  const map = this.getMap();
  let resetControl = null;
  // remove all the other, eventually toggled, interactioncontrols
  const controls = map.getControls();
  controls.forEach((control) => {
    if(control.id && control.toggle && (control.id != this.id)) {
      control.toggle(false);
      if (control.name == 'reset') {
        resetControl = control;
      }
    }
  });
  if (!this._toggled && resetControl) {
    resetControl.toggle(true);
  }
  this.dispatchEvent('controlclick');
};

//shift of control position
proto.shiftPosition = function(position) {
  $(this.element).css(hWhere, position+'px');
};

// layout handler
proto.layout = function(map) {
  if (map) {
    const position =  this.getPosition();
    const element = $(this.element);
    layout({map, position, element})
  }
};

// change layout of controls
proto.changelayout = function(map) {
  const viewPort = map.getViewport();
  const viewPortWidth = $(viewPort).width();
  const previusControls = $(viewPort).find('.ol-control-'+this.positionCode+':visible');
  const firstControl = previusControls.first();
  const firtsLeft = firstControl.position().left;
  const firstControlHeightOffset = firstControl[0].offsetHeight;
  const topPosition = previusControls.first().position().top + firstControlHeightOffset + 6; // 6 margin
  const element = $(this.element);
  const nextElement = element.next('.ol-control-'+this.positionCode+':visible');
  const prevElement = element.prev('.ol-control-'+this.positionCode+':visible');
  // check if left position of the controls more than dimension of viewport
  if (element.position().left + element.width() > viewPortWidth) {
    if (nextElement.length && nextElement.position().top  ==  topPosition) {
      element.css('left', firtsLeft+'px');
      const elementWidth = element[0].offsetWidth;
      const hOffset = element.position().left + elementWidth;
      nextElement.css('left', hOffset+'px');
      element.css('top', topPosition+'px');
    } else {
      if (prevElement.position() && (topPosition == prevElement.position().top)) {
        const elementWidth = prevElement[0].offsetWidth;
        const hOffset = prevElement.position().left + elementWidth;
        element.css('top', topPosition+'px');
        element.css('left', hOffset+'px');
      } else {
        element.css('top', topPosition +'px');
        element.css('left', firtsLeft+'px');
      }
    }
  } else {
    if (nextElement.length && nextElement.position().top != previusControls.first().position().top) {
      nextElement.css('top', element.position().top +'px');
      const elementWidth = element[0].offsetWidth;
      const hOffset = element.position().left  + elementWidth;
      nextElement.css('left', hOffset+'px');
    }
  }
};

proto.showHide = function() {
  $(this.element).toggle();
};

//called when a control is added to map
proto.setMap = function(map) {
  if (map) {
    this.layout(map);
    ol.control.Control.prototype.setMap.call(this, map);
  }
};

//hide control and move all controls that sit on his right position
proto.hideControl = function() {
  let position = $(this.element).position().left;
  let controlWidth = $(this.element).outerWidth();
  let newPosition = position;
  const controls = $(this.element).siblings('.ol-control-tl');
  controls.each(function() {
    if ($(this).position().left > position) {
      newPosition = $(this).position().left;
      if (controlWidth > $(this).outerWidth()) {
        position = position + (controlWidth - $(this).outerWidth())
      }
      $(this).css('left', position+'px');
      position = newPosition;
      controlWidth = $(this).outerWidth();
    }
  });
  $(this.element).hide();
};

proto._postRender = function() {};

module.exports = Control;
