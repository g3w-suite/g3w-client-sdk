var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');

function CatalogService() {
  var self = this;
  this.state = {
    prstate: ProjectsRegistry.state,
    highlightlayers: false,
    externallayers:[]
  };
  this.setters = {};
}

inherit(CatalogService, G3WObject);

module.exports = CatalogService;
