const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function MapsRegistry() {
  base(this);
  
  this._mapsServices = {};
  
  this.addMap = function(mapService) {
    this._registerMapService(mapService);
  };
  
  this._registerMapService = function(mapService) {
    const mapService = this._mapsServices[mapService.id]
    if (_.isUndefined(mapService)) {
      this._mapsServices[mapService.id] = mapService;
    }
  };
} 
inherit(MapsRegistry,G3WObject);

module.exports = MapsRegistry;
