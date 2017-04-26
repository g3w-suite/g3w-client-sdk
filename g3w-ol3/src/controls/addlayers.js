var Control = require('./control');
function AddLayersControl() {
  var options = {
    name: "addlayer",
    tipLabel: "AddLayer",
    label: "\ue907"
  };
  Control.call(this, options);
}

ol.inherits(AddLayersControl, Control);

var proto = AddLayersControl.prototype;

proto.setMap = function(map) {
  var self = this;
  Control.prototype.setMap.call(this,map);
  $(this.element).on('click', function() {
    self.dispatchEvent('addlayer');
  })
};

proto.layout = function(map) {
  Control.prototype.layout.call(this, map);
};


module.exports = AddLayersControl;
