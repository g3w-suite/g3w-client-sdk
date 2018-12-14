const BaseLayers = {
  'OSM': require('./osmlayer'),
  'Bing': require('./binglayer'),
  'TMS': require('./tmslayer'),
  'WMTS': require('./wmtslayer')
};

module.exports = BaseLayers;
