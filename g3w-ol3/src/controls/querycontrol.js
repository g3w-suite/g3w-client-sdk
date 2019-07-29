const utils = require('../utils');
const InteractionControl = require('./interactioncontrol');
const PickCoordinatesInteraction = require('../interactions/pickcoordinatesinteraction');

const QueryControl = function(options){
  const _options = {
    name: "querylayer",
    tipLabel: "Query layer",
    label: options.label || "\uea0f",
    interactionClass: PickCoordinatesInteraction
  };
  options = utils.merge(options, _options);
  InteractionControl.call(this, options);
};

ol.inherits(QueryControl, InteractionControl);

const proto = QueryControl.prototype;

proto.setMap = function(map) {
  InteractionControl.prototype.setMap.call(this, map);
  const querySingleClickFnc = (event) => {
    this.dispatchEvent({
      type: 'picked',
      coordinates: event.coordinate
    });
    if(this._autountoggle) {
      this.toggle(true);
    }
  };

  this.on('toggled', (event)=> {
    const toggled = event.target.isToggled();
    toggled && map.on('singleclick', querySingleClickFnc) || map.un('singleclick', querySingleClickFnc);
  })
};

module.exports = QueryControl;
