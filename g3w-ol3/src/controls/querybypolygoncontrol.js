var utils = require('../utils');
var InteractionControl = require('./interactioncontrol');

var PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

var QueryByPolygonControl = function(options){
  var self = this;
  var _options = {
    name: "querybypolygon",
    tipLabel: "Query By Polygon",
    label: "\ue903",
    geometryTypes: ['Polygon', 'MultiPolygon'],
    onselectlayer: true,
    interactionClass: PickCoordinatesInteraction,
    help: '<h4>Guida - Query By Polygon</h4><ul><li>Seleziona uno strato poligonale</li><li>Clicca su una feature dello strato selezionato per lanciare la selezione</li></ul>',
    onhover: true
  };
  options = utils.merge(options,_options);
  InteractionControl.call(this,options);
};

ol.inherits(QueryByPolygonControl, InteractionControl);

var proto = QueryByPolygonControl.prototype;

proto.setMap = function(map) {
  var self = this;
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('boxstart',function(e){
    self._startCoordinate = e.coordinate;
  });

  this._interaction.on('picked',function(e){
    self.dispatchEvent({
      type: 'picked',
      coordinates: e.coordinate
    });
    if (self._autountoggle) {
      self.toggle();
    }
  });
};

module.exports = QueryByPolygonControl;
