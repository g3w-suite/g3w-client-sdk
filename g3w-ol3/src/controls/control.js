var Control = function(options) {
  var name = options.name || "?";
  this.name = name.split(' ').join('-').toLowerCase();
  this.id = this.name+'_'+(Math.floor(Math.random() * 1000000));
  this.positionCode = options.position || 'tl';
  this.priority = options.priority || 0;
  if (!options.element) {
    var className = "ol-"+this.name.split(' ').join('-').toLowerCase();
    var tipLabel = options.tipLabel || this.name;
    var label = options.label || "?";
    options.element = $('<div class="'+className+' ol-unselectable ol-control"><button type="button" title="'+tipLabel+'">'+label+'</button></div>')[0];
  }
  $(options.element).addClass("ol-control-"+this.positionCode);
  var buttonClickHandler = options.buttonClickHandler || Control.prototype._handleClick.bind(this);
  $(options.element).on('click',buttonClickHandler);
  ol.control.Control.call(this,options);
  this._postRender();

};

// sotto classse della classe Control di OL3
ol.inherits(Control, ol.control.Control);

var proto = Control.prototype;

proto.getPosition = function(positionCode) {
  var positionCode = positionCode || this.positionCode;
  var position = {};
  position['top'] = (positionCode.indexOf('t') > -1) ? true : false;
  position['left'] = (positionCode.indexOf('l') > -1) ? true : false;
  return position;
};

proto._handleClick = function(event) {
  event.preventDefault();
  var self = this;
  var map = this.getMap();
  var resetControl = null;
  // remove all the other, eventually toggled, interactioncontrols
  var controls = map.getControls();
  controls.forEach(function(control){
    if(control.id && control.toggle && (control.id != self.id)) {
      control.toggle(false);
      if (control.name == 'reset') {
        resetControl = control;
      }
    }
  });
  if (!self._toggled && resetControl) {
    resetControl.toggle(true);
  }
  this.dispatchEvent('controlclick');
};

//funzione che fa lo shift della posizione
proto.shiftPosition = function(position) {
  $(this.element).css(hWhere, position+'px');
};

// funzione che gestisce il layout
proto.layout = function(map) {
  if (map) {
    var position =  this.getPosition();
    var viewPort = map.getViewport();
    // vado a verificare se trovo elementi con lo stessa classe .ol-control-t o .ol-control-tl(che sono i default di ol3)
    var previusControls = $(viewPort).find('.ol-control-'+this.positionCode+':visible');
    if (previusControls.length) {
      previusControl = previusControls.last();
      var previousOffset = position.left ? previusControl.position().left : previusControl.position().top;
      var hWhere = position.left ? 'left' : 'top';
      var previousWidth = previusControl[0].offsetWidth;
      var hOffset = $(this.element).position()[hWhere] + previousOffset + previousWidth;
      $(this.element).css(hWhere,hOffset+'px');
    }
  }
};

// funzione che viene chiamata al momento che il controllo viene
// aggiunto alla mappa
proto.setMap = function(map) {
  if (map) {
    this.layout(map);
    ol.control.Control.prototype.setMap.call(this, map);
  }
};

// funzione che nasconde il controllo e sposta tutti i controlli a destra
// senza lasciare il buco
proto.hideControl = function() {
  var position = $(this.element).position().left
  var controlWidth = $(this.element).outerWidth();
  var newPosition = position;
  var controls = $(this.element).siblings('.ol-control-tl');
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
