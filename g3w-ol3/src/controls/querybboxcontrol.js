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

var proto = QueryBBoxControl.prototype;

proto.setMap = function(map) {
  var self = this;
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('boxstart',function(e){
    self._startCoordinate = e.coordinate;
  });
  this._interaction.on('boxend',function(e){
    var start_coordinate = self._startCoordinate;
    var end_coordinate = e.coordinate;
    var extent = ol.extent.boundingExtent([start_coordinate,end_coordinate]);
    self.dispatchEvent({
      type: 'bboxend',
      extent: extent
    });
    self._startCoordinate = null;
    if (self._autountoggle) {
      self.toggle();
    }
  })
};

module.exports = QueryBBoxControl;
