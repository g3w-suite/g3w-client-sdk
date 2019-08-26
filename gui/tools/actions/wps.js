const WPSPPanel = require('gui/wps/vue/panel/wpspanel');

module.exports = function(options={}) {
  const panel = new WPSPPanel(options);
  panel.show();
  return panel;
};
