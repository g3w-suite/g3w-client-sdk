const inherit = require('core/utils/utils').inherit;
const XHR = require('core/utils/utils').XHR;
const base = require('core/utils/utils').base;
const getMapLayerById = require('core/utils/geo').getMapLayerById;
const ProjectsRegistry = require('core/project/projectsregistry');
const G3WObject = require('core/g3wobject');


function RelationsService(options={}) {
  this.state = {};
  const {layer} = options;
  this._project = ProjectsRegistry.getCurrentProject();
  base(this);

  this.getRelations = function(options={}) {
    const relation = options.relation || {};
    const layerId = layer.id === relation.referencedLayer ?relation.referencingLayer: relation.referencedLayer;
    const dataUrl = getMapLayerById(layerId).getUrl('data');
    const projectId = this._project.state.id;
    const value = options.value || null;
    let fid = options.fid.split('.');
    fid = fid.length === 1 ? fid[0]: fid[1];
    const id = relation.id;
    const url = `${dataUrl}?relationonetomany=${id}|${fid}`;//`/qdjango/api/relations/${projectId}/${id}/${value}`;
    return XHR.get({
      url
    })
  };

}

inherit(RelationsService, G3WObject);

module.exports = RelationsService;
