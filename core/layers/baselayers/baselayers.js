const BaseLayers = {
  'OSM': require('./osmlayer'),
  'Bing': require('./binglayer'),
  'TMS': require('./tmslayer'),
  'ARCGIS': require('./arcgislayer'),
  'WMTS': require('./wmtslayer')
};

module.exports = BaseLayers;
