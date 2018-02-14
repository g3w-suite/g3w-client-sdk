const utils = require('../utils');
const InteractionControl = require('./interactioncontrol');
const PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

const QueryControl = function(options){
  const _options = {
    name: "querylayer",
    tipLabel: "Query layer",
    label: "\uea0f",
    interactionClass: PickCoordinatesInteraction
  };
  options = utils.merge(options, _options);
  InteractionControl.call(this, options);
};

ol.inherits(QueryControl, InteractionControl);

const proto = QueryControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this,map);
  this._interaction.on('picked',(e) =>  {
    this.dispatchEvent({
      type: 'picked',
      coordinates: e.coordinate
    });
    if (this._autountoggle) {
      this.toggle();
    }
  });
};

module.exports = QueryControl;
