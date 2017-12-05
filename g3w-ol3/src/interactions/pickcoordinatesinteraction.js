var PickCoordinatesEventType = {
  PICKED: 'picked'
};

var PickCoordinatesEvent = function(type, coordinate) {
  this.type = type;
  this.coordinate = coordinate;
};

var PickCoordinatesInteraction = function(options) {
  this.previousCursor_ = null;
  this._centerMap = null;
  
  ol.interaction.Pointer.call(this, {
    handleDownEvent: PickCoordinatesInteraction.handleDownEvent_,
    handleUpEvent: PickCoordinatesInteraction.handleUpEvent_,
    handleMoveEvent: PickCoordinatesInteraction.handleMoveEvent_
  });
};

ol.inherits(PickCoordinatesInteraction, ol.interaction.Pointer);

PickCoordinatesInteraction.handleDownEvent_ = function(event) {
  var self = this;
  this._centerMap = event.map.getView().getCenter();
  // insericos un timeout per evitare che il pan venga bloccato
  setTimeout(function() {
    if (self._centerMap == event.map.getView().getCenter()) {
      PickCoordinatesInteraction.handleUpEvent_.call(self, event);
    }
  }, 300);
  // ritorno false per evirare lo start dell'evento drag
  return false
};


PickCoordinatesInteraction.handleUpEvent_ = function(event) {
  this.dispatchEvent(
          new PickCoordinatesEvent(
              PickCoordinatesEventType.PICKED,
              event.coordinate));
  // serve per fermare il drag event
  return false;
};

PickCoordinatesInteraction.handleMoveEvent_ = function(event) {
  var elem = event.map.getTargetElement();
  elem.style.cursor =  'pointer';
  return true;
};

PickCoordinatesInteraction.prototype.shouldStopEvent = function() {
  return false;
};

PickCoordinatesInteraction.prototype.setActive = function(active) {
  var map = this.getMap();
  if (map) {
    var elem = map.getTargetElement();
    elem.style.cursor = '';
  }
  ol.interaction.Pointer.prototype.setActive.call(this,active);
};

PickCoordinatesInteraction.prototype.setMap = function(map){
  if (!map) {
    var elem = this.getMap().getTargetElement();
    elem.style.cursor = '';
  }
  ol.interaction.Pointer.prototype.setMap.call(this,map);
};

module.exports = PickCoordinatesInteraction;
