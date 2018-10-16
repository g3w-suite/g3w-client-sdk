const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const ProjectsRegistry = require('core/project/projectsregistry');
const G3WObject = require('core/g3wobject');


function RelationsService() {
  this.state = {};
  this._project = ProjectsRegistry.getCurrentProject();
  base(this);

  this.getRelations = function(options) {
    options = options || {};
    const projectId = this._project.state.id;
    const value = options.value || null;
    const id = options.id || null;
    return $.get('/qdjango/api/relations/'+projectId+'/'+id+'/'+value)
  };
  
}

inherit(RelationsService, G3WObject);

module.exports = RelationsService;
