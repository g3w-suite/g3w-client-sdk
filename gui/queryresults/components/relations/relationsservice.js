var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var ProjectsRegistry = require('core/project/projectsregistry');
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');


function RelationsService(options) {
  this.state = {};
  this._project = ProjectsRegistry.getCurrentProject();
  base(this);

  this.getRelations = function(options) {
    var projectId = this._project.state.id;
    options = options || {};
    var value = options.value || null;
    var id = options.id || null;
    return $.get('/qdjango/api/relations/'+projectId+'/'+id+'/'+value)
  };
  this.buildRelationTable = function(relations) {
    var columns = _.keys(relations[0]);
    var rows = [];
    _.forEach(relations, function(relation){
      rows.push(_.values(relation));
    });
    return {
      columns: columns,
      rows: rows
    }
  };
}

inherit(RelationsService, G3WObject);

module.exports = RelationsService;
