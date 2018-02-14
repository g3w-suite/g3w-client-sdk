var utils = require('../utils');
var InteractionControl = require('./interactioncontrol');

var QueryBBoxControl = function(options){
  this._startCoordinate = null;
  var _options = {
    name: "querybbox",
    tipLabel: "Query BBox layer",
    label: "\ue902",
    interactionClass: ol.interaction.DragBox,
    help: '<h4>Guida - Query BBox layer</h4><ul><li>Disegna un rettangolo per interrogare gli strati evidenziati in giallo</li></ul>'
  };
  options = utils.merge(options,_options);
  InteractionControl.call(this,options);
};

ol.inherits(QueryBBoxControl, InteractionControl);

const proto = QueryBBoxControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('boxstart',(e) => {
    this._startCoordinate = e.coordinate;
  });
  this._interaction.on('boxend',(e) => {
    const start_coordinate = this._startCoordinate;
    const end_coordinate = e.coordinate;
    const extent = ol.extent.boundingExtent([start_coordinate,end_coordinate]);
    this.dispatchEvent({
      type: 'bboxend',
      extent: extent
    });
    this._startCoordinate = null;
    if (this._autountoggle) {
      this.toggle();
    }
  })
};

module.exports = QueryBBoxControl;
