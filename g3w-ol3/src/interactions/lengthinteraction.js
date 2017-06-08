//messaggio durante il disegno della linea

var continueLineMsg = "Clicca sulla mappa per continuare a disegnare la linea.<br>CANC se si vuole cancellare l'ultimo vertice inserito";

/**
 * Format length output.
 * @param {ol.geom.LineString} line The line.
 * @return {string} The formatted length.
 */
var formatLength = function(line) {
  var length;
  length = Math.round(line.getLength() * 100) / 100;
  var output;
  if (length > 1000) {
    output = (Math.round(length / 1000 * 1000) / 1000) +
      ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
      ' ' + 'm';
  }
  return output;
};


// stili

var styleFunction = function(feature) {
  var geometry = feature.getGeometry();
  var styles = [
    // linestring
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        lineDash: [10, 10],
        width: 3
      })
    })
  ];

  geometry.forEachSegment(function(start, end) {
    var dx = end[0] - start[0];
    var dy = end[1] - start[1];
    var rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(new ol.style.Style({
      geometry: new ol.geom.Point(end),
      image: new ol.style.Icon({
        src: 'https://openlayers.org/en/v4.1.1/examples/data/arrow.png',
        anchor: [0.75, 0.5],
        rotateWithView: true,
        rotation: -rotation
      })
    }));
  });
  return styles;
};

var measureStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 255, 255, 0.2)'
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 3
  }),
  image: new ol.style.Circle({
    radius: 5,
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    })
  })
});

/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;

/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */


var featureGeometryChangelistener;
var poinOnMapMoveListener;


// LenghtInteracion

var LenghtIteraction = function() {
  var source = new ol.source.Vector();
  this._helpTooltipElement;
  this._map = null;
  this._feature = null;
  this._layer = new ol.layer.Vector({
    source: source,
    style: styleFunction
  });
  ol.interaction.Draw.call(this, {
    source: source,
    type: 'LineString',
    style: measureStyle
  });

  this.set('beforeRemove', this.clear);
  this.set('layer', this._layer);

  // registro gli eventi sulle due interaction
  this.on('drawstart', this._drawStart);
  this.on('drawend', this._drawEnd);

};

ol.inherits(LenghtIteraction, ol.interaction.Draw);


var proto = LenghtIteraction.prototype;

proto.clear = function() {
  this._layer.getSource().clear();
  this._clearMessagesAndListeners();
  if (this._map) {
    this._map.removeOverlay(measureTooltip);
    this._map.removeLayer(this._layer);
  }
};

proto._clearMessagesAndListeners = function(){
  var self = this;
  this._feature = null;
  // unset tooltip so that a new one can be created
  if (this._map) {
    measureTooltipElement = null;
    this._helpTooltipElement.innerHTML = '';
    this._helpTooltipElement.classList.add('hidden');
    ol.Observable.unByKey(featureGeometryChangelistener);
    ol.Observable.unByKey(poinOnMapMoveListener);
    $(document).off('keydown', _.bind(this._removeLastPoint, this));
  }
};

proto._removeLastPoint = function(event) {
  if (event.keyCode === 46) {
    this.removeLastPoint();
  }
};

//funzione drawStart
proto._drawStart = function(evt) {
  var self = this;
  this._map = this.getMap();
  this._createMeasureTooltip();
  this._createHelpTooltip();
  $(document).on('keydown', _.bind(this._removeLastPoint, this));
  // vado a ripulire tutte le features
  this._layer.getSource().clear();
  poinOnMapMoveListener = this._map.on('pointermove', function(evt) {
    if (evt.dragging) {
      return;
    }
    /** @type {string} */
    var helpMsg = 'Clicca sulla mappa per iniziare a tracciare la lunghezza';
    if (self._feature) {
      helpMsg = continueLineMsg;
    }

    self._helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
    self._helpTooltipElement.classList.remove('hidden');
  });

  this._feature = evt.feature;
  var tooltipCoord = evt.coordinate;
  featureGeometryChangelistener = this._feature.getGeometry().on('change', function(evt) {
    var geom = evt.target;
    var output;
    if (geom instanceof ol.geom.LineString) {
      output = formatLength(geom);
      tooltipCoord = geom.getLastCoordinate();
    }
    measureTooltipElement.innerHTML = output;
    measureTooltip.setPosition(tooltipCoord);
  });
};

//funzione drawEnd
proto._drawEnd = function() {
  measureTooltipElement.className = 'mtooltip mtooltip-static';
  measureTooltip.setOffset([0, -7]);
  this._clearMessagesAndListeners();
  this._map.addLayer(this._layer);
};

/**
 * Creates a new help tooltip
 */
proto._createHelpTooltip = function() {
  if (this._helpTooltipElement) {
    this._helpTooltipElement.parentNode.removeChild(this._helpTooltipElement);
  }
  if (helpTooltip) {
    this._map.removeOverlay(helpTooltip);
  }
  this._helpTooltipElement = document.createElement('div');
  this._helpTooltipElement.className = 'mtooltip hidden';
  helpTooltip = new ol.Overlay({
    element: this._helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  this._map.addOverlay(helpTooltip);
};


/**
 * Creates a new measure tooltip
 */
proto._createMeasureTooltip = function() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  if (measureTooltip) {
    this._map.removeOverlay(measureTooltip);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'mtooltip mtooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  this._map.addOverlay(measureTooltip);
};
// END MEASURE CONTROLS //

module.exports = LenghtIteraction;