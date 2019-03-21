const utils = require('../utils');
const InteractionControl = require('./interactioncontrol');
const PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');
const VALIDGEOMETRIES = ['Polygon', 'MultiPolygon'];

const QueryByPolygonControl = function(options = {}) {
  const _options = {
    name: "querybypolygon",
    tipLabel: "Query By Polygon",
    label: "\ue903",
    onselectlayer: true,
    interactionClass: PickCoordinatesInteraction,
    onhover: true
  };
  options = utils.merge(options,_options);
  const layers = options.layers || [];
  // if no layer or just one
  if (!layers.length || layers.length === 1) {
      options.visible = false
  } else {
    // geometryes to check
    const geometryTypes = options.geometryTypes = VALIDGEOMETRIES ;
    // gell all layer that have the geometries above
    const mainQueryLayers = layers.filter((layer) => {
      return geometryTypes.indexOf(layer.getGeometryType()) !== -1
    });
    // get all layers that haven't the geometries above na dare filterable
    const layersToQuery = layers.filter((layer) => {
      return layer.isFilterable() && (mainQueryLayers.length > 1 ? true : layer !== mainQueryLayers[0]);
    });
    options.visible = !!layersToQuery.length && !!mainQueryLayers.length;
  }
  InteractionControl.call(this, options);
};

ol.inherits(QueryByPolygonControl, InteractionControl);

const proto = QueryByPolygonControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('picked',(e) => {
    this.dispatchEvent({
      type: 'picked',
      coordinates: e.coordinate
    });
    if (this._autountoggle) {
      this.toggle();
    }
  });
  this.setEnable(false);
};

module.exports = QueryByPolygonControl;
