const Control = require('./control');
function Screenshotcontrol(options = {}) {
  const _options = {
    name: "maptoimage",
    tipLabel: "Screenshot",
    label: "\ue90f"
  };
  this._onclick = options.onclick;
  Control.call(this, _options);
}

ol.inherits(Screenshotcontrol, Control);

const proto = Screenshotcontrol.prototype;

proto.setMap = function(map) {
  Control.prototype.setMap.call(this,map);
  const controlElement = $(this.element);
  const buttonControl = controlElement.children('button');
  let cliccked = false;
  controlElement.on('click', ()  => {
    if (!cliccked) {
      cliccked = true;
      buttonControl.addClass('g3w-ol-disabled');
      this._onclick && this._onclick().then(() => {}).then(()=> {
        buttonControl.removeClass('g3w-ol-disabled');
        cliccked = false;
      })
    }
  })
};

module.exports = Screenshotcontrol;
