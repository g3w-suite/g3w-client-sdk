const utils = require('../utils');
const InteractionControl = require('./interactioncontrol');
const PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

const QueryByPolygonControl = function(options){
  const _options = {
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

const proto = QueryByPolygonControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('boxstart',(e) =>{
    this._startCoordinate = e.coordinate;
  });

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
