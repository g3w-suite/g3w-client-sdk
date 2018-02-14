const Control = function(options) {
  const name = options.name || "?";
  this.name = name.split(' ').join('-').toLowerCase();
  this.id = this.name+'_'+(Math.floor(Math.random() * 1000000));
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
    const viewPort = map.getViewport();
    //check if there are element with the same class .ol-control-t o .ol-control-tl(default di ol3)
    const previusControls = $(viewPort).find('.ol-control-'+this.positionCode+':visible');
    if (previusControls.length) {
      previusControl = previusControls.last();
      const previousOffset = position.left ? previusControl.position().left : previusControl.position().top;
      const hWhere = position.left ? 'left' : 'top';
      const previousWidth = previusControl[0].offsetWidth;
      const hOffset = $(this.element).position()[hWhere] + previousOffset + previousWidth;
      $(this.element).css(hWhere,hOffset+'px');
    }
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
  const nextElement = $(this.element).next('.ol-control-'+this.positionCode+':visible');
  const prevElement = $(this.element).prev('.ol-control-'+this.positionCode+':visible');
  // check if left position of the controlis more than dimension of viewport
  if ($(this.element).position().left + $(this.element).width() > viewPortWidth) {
    if (nextElement.length && nextElement.position().top  ==  topPosition) {
      $(this.element).css('left', firtsLeft+'px');
      const elementWidth = $(this.element)[0].offsetWidth;
      const hOffset = $(this.element).position().left + elementWidth;
      nextElement.css('left', hOffset+'px');
      $(this.element).css('top', topPosition+'px');
    } else {
      if (prevElement.position() && (topPosition == prevElement.position().top)) {
        const elementWidth = prevElement[0].offsetWidth;
        const hOffset = prevElement.position().left + elementWidth;
        $(this.element).css('top', topPosition+'px');
        $(this.element).css('left', hOffset+'px');
      } else {
        $(this.element).css('top', topPosition +'px');
        $(this.element).css('left', firtsLeft+'px');
      }
    }
  } else {
    // vado a verificare se il controllo successiovo si tova ad un'altezza diversa dal primo controllo
    if (nextElement.length && nextElement.position().top != previusControls.first().position().top) {
      nextElement.css('top', $(this.element).position().top +'px');
      const elementWidth = $(this.element)[0].offsetWidth;
      const hOffset = $(this.element).position().left  + elementWidth;
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
