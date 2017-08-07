var OGC_PIXEL_WIDTH = 0.28;
var OGC_DPI = 25.4/OGC_PIXEL_WIDTH;

module.exports = {
  resToScale: function(res, unit) {
    var unit = unit || 'm';
    var scale;
    switch (unit) {
      case 'm':
        var scale = (res*1000) / OGC_PIXEL_WIDTH;
        break;
    }
    return scale;
  },
  scaleToRes: function(scale, unit) {
    var unit = unit || 'm';
    var resolution;
    switch (unit) {
      case 'm':
        var resolution = (scale * OGC_PIXEL_WIDTH) / 1000;
        break
    }
    return resolution;
  }
};
