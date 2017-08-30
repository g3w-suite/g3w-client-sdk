var DeleteInteractionEvent = function(type, layer, features, coordinate) {
  this.type = type;
  this.features = features;
  this.coordinate = coordinate;
};

var DeleteInteraction = function(options) {
  ol.interaction.Pointer.call(this, {
    handleDownEvent: DeleteInteraction.handleDownEvent_,
    handleMoveEvent: DeleteInteraction.handleMoveEvent_,
    handleUpEvent: DeleteInteraction.handleUpEvent_,
    handleEvent: DeleteInteraction.handleEvent_
  });

  this.previousCursor_ = undefined;
  this.startCursor_ = undefined;
  this.lastCoordinate_ = null;
  this.features_ = options.features !== undefined ? options.features : null;
  this.layer_ = options.layer !== undefined ? options.layer : null;
  this.map_ = null;
};

ol.inherits(DeleteInteraction, ol.interaction.Pointer);

DeleteInteraction.handleEvent_ = function(mapBrowserEvent) {
  if (mapBrowserEvent.type == 'keydown'){
    if(this.features_.getArray().length && mapBrowserEvent.originalEvent.keyCode == 46) {
      // un evento può essere una stringa o un oggetto con un attributo type
      this.dispatchEvent(
          new DeleteInteractionEvent(
              'deleteend',
              this.layer_,
              this.features_,
              event.coordinate));
      return true;
    }
  }
  else {
    return ol.interaction.Pointer.handleEvent.call(this,mapBrowserEvent);
  }
};

DeleteInteraction.handleDownEvent_ = function(event) {
  this.lastFeature_ = this.featuresAtPixel_(event.pixel, event.map);
  if (this.lastFeature_) {
    DeleteInteraction.handleMoveEvent_.call(this, event);
    this.dispatchEvent(
            new DeleteInteractionEvent(
                'deleteend',
                this.layer_,
                this.features_,
                event.coordinate));
    return true;
  }
  return false;
};

DeleteInteraction.handleMoveEvent_ = function(event) {
  var self = this;
  this.map_ = event.map;
  var elem = this.map_.getTargetElement();
  if (this.startCursor_ === undefined) {
    this.startCursor_ = elem.style.cursor;
  }
  var intersectingFeature = this.map_.forEachFeatureAtPixel(event.pixel,
      function(feature, layer) {
        // vado a verificare che il layer sia quello in editing in quel momento
        feature = (layer == self.layer_) ? feature : null;
        return feature;
      });
  if (intersectingFeature) {
    this.previousCursor_ = elem.style.cursor;
    elem.style.cursor =  'pointer';

  } else {
    elem.style.cursor = this.previousCursor_ !== undefined ?
        this.previousCursor_ : '';
    this.previousCursor_ = undefined;
  }
};

DeleteInteraction.prototype.featuresAtPixel_ = function(pixel, map) {
  var found = null;
  var intersectingFeature = map.forEachFeatureAtPixel(pixel,
      function(feature) {
        return feature;
      });
  if (this.features_ &&
     _.includes(this.features_.getArray(), intersectingFeature)) {
    found = intersectingFeature;
  }
  return found;
};


DeleteInteraction.prototype.clear = function() {
  var elem;
  if (this.map_) {
    elem = this.map_.getTargetElement();
    elem.style.cursor = this.startCursor_;
  }
};


module.exports = DeleteInteraction;
