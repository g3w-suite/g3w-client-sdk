// MeasureInteracion

var MeasureIteraction = function(options) {
  this._helpTooltip;
  this._measureTooltipElement;
  this._measureTooltip;
  this._featureGeometryChangelistener;
  this._poinOnMapMoveListener;

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
  var geometryType = options.geometryType || 'LineString';
  this._formatMeasure = null;
  this._helpMsg = null;
  // funzione che serve per gestire il keydow della cancellazione ultimo vertice disegnato
  this._keyDownEventHandler = null;
  switch (geometryType) {
    case 'LineString':
     this._formatMeasure = function(feature) {
        var length;
        length = Math.round(feature.getLength() * 100) / 100;
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
      this._helpMsg = "Clicca sulla mappa per continuare a disegnare la linea.<br>CANC se si vuole cancellare l'ultimo vertice inserito";
      break;
    case 'Polygon':
      this._formatMeasure = function(feature) {
        var area;
        area = Math.round(feature.getArea() * 100) / 100;
        var output;
        if (area > 1000) {
          output = (Math.round(area / 1000 * 1000) / 1000) +
            ' ' + 'km<sup>2</sup>';
        } else {
          output = (Math.round(area * 100) / 100) +
            ' ' + 'm<sup>2</sup>';
        }
        return output;
      };
      this._helpMsg = "Click per continuare a disegnare il poligono.<br>CANC se si vuole cancellare l'ultimo vertice inserito";
      break;
  }
  var source = new ol.source.Vector();
  this._helpTooltipElement;
  this._map = null;
  this._feature = null;
  this._layer = new ol.layer.Vector({
    source: source,
    style: function(feature) {
      var styles = [
        // linestring
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            lineDash: [10, 10],
            width: 3
          }),
          fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          })
        })
      ];
      return styles;
    }
  });
  ol.interaction.Draw.call(this, {
    source: source,
    type: geometryType,
    style: measureStyle
  });

  this.set('beforeRemove', this.clear);
  this.set('layer', this._layer);

  // registro gli eventi sulle due interaction
  this.on('drawstart', this._drawStart);
  this.on('drawend', this._drawEnd);

};

ol.inherits(MeasureIteraction, ol.interaction.Draw);


var proto = MeasureIteraction.prototype;

proto.clear = function() {
  this._layer.getSource().clear();
  this._clearMessagesAndListeners();
  if (this._map) {
    this._map.removeOverlay(this._measureTooltip);
    this._map.removeLayer(this._layer);
  }
};

proto._clearMessagesAndListeners = function() {
  this._feature = null;
  // unset tooltip so that a new one can be created
  if (this._map) {
    this._measureTooltipElement = null;
    this._helpTooltipElement.innerHTML = '';
    this._helpTooltipElement.classList.add('hidden');
    ol.Observable.unByKey(this._featureGeometryChangelistener);
    ol.Observable.unByKey(this._poinOnMapMoveListener);
    $(document).off('keydown', this._keyDownEventHandler);
  }
};

proto._removeLastPoint = function(event) {
  var geom = this._feature.getGeometry();
  if (event.keyCode === 46) {
    if( geom instanceof ol.geom.Polygon && geom.getCoordinates()[0].length > 2) {
      this.removeLastPoint();
    } else if(geom instanceof ol.geom.LineString && geom.getCoordinates().length > 1) {
      this.removeLastPoint();
    }
  }
};

//funzione drawStart
proto._drawStart = function(evt) {
  var self = this;
  this._map = this.getMap();
  this._createMeasureTooltip();
  this._createHelpTooltip();
  this._feature = evt.feature;
  this._keyDownEventHandler = _.bind(this._removeLastPoint, this);
  $(document).on('keydown', this._keyDownEventHandler);
  // vado a ripulire tutte le features
  this._layer.getSource().clear();
  this._poinOnMapMoveListener = this._map.on('pointermove', function(evt) {
    if (evt.dragging) {
      return;
    }
    if (self._feature) {
      helpMsg = self._helpMsg;
    }
    self._helpTooltipElement.innerHTML = helpMsg;
    self._helpTooltip.setPosition(evt.coordinate);
    self._helpTooltipElement.classList.remove('hidden');
  });
  var tooltipCoord = evt.coordinate;
  this._featureGeometryChangelistener = this._feature.getGeometry().on('change', function(evt) {
    var geom = evt.target;
    var output;
    if (geom instanceof ol.geom.Polygon) {
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof ol.geom.LineString) {
      tooltipCoord = geom.getLastCoordinate();
    }
    output = self._formatMeasure(geom);
    self._measureTooltipElement.innerHTML = output;
    self._measureTooltip.setPosition(tooltipCoord);
  });
};

//funzione drawEnd
proto._drawEnd = function() {
  this._measureTooltipElement.className = 'mtooltip mtooltip-static';
  this._measureTooltip.setOffset([0, -7]);
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
  if (this._helpTooltip) {
    this._map.removeOverlay(this._helpTooltip);
  }
  this._helpTooltipElement = document.createElement('div');
  this._helpTooltipElement.className = 'mtooltip hidden';
  this._helpTooltip = new ol.Overlay({
    element: this._helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  this._map.addOverlay(this._helpTooltip);
};


/**
 * Creates a new measure tooltip
 */
proto._createMeasureTooltip = function() {
  if (this._measureTooltipElement) {
    this._measureTooltipElement.parentNode.removeChild(this._measureTooltipElement);
  }
  if (this._measureTooltip) {
    this._map.removeOverlay(this._measureTooltip);
  }
  this._measureTooltipElement = document.createElement('div');
  this._measureTooltipElement.className = 'mtooltip mtooltip-measure';
  this._measureTooltip = new ol.Overlay({
    element: this._measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  this._map.addOverlay(this._measureTooltip);
};
// END MEASURE CONTROLS //

module.exports = MeasureIteraction;