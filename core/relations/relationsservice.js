const inherit = require('core/utils/utils').inherit;
const XHR = require('core/utils/utils').XHR;
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
    const url = `/qdjango/api/relations/${projectId}/${id}/${value}`;
    return XHR.get({
      url
    })
  };

}

inherit(RelationsService, G3WObject);

module.exports = RelationsService;
