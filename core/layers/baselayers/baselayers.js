const BaseLayers = {
  'OSM': require('./osmlayer'),
  'Bing': require('./binglayer'),
  'TMS': require('./tmslayer'),
  'wmts': require('./wmtslayer')
};

module.exports = BaseLayers;
