var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ProjectsStore = require('core/project/projectsstore');

function CatalogService() {
  this.state = {
    prstate: ProjectsStore.state,
    highlightlayers: false,
    externallayers:[]
  };
  this.setters = {};
  this.addExternalLayer = function(layer) {
    this.state.externallayers.push(layer);
  };
  this.removeExternalLayer = function(name) {
    var self = this;
    _.forEach(this.state.externallayers, function(layer, index) {
      if (layer.name == name) {
        self.state.externallayers.splice(index, 1);
        return false
      }
    });
  };
  base(this);
}

inherit(CatalogService, G3WObject);

module.exports = CatalogService;
