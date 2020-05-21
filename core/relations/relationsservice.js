const inherit = require('core/utils/utils').inherit;
const XHR = require('core/utils/utils').XHR;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function RelationsService(options={}) {
  base(this);
}

inherit(RelationsService, G3WObject);

const proto = RelationsService.prototype;

proto.getRelations = function(options={}) {
  const ProjectsRegistry = require('core/project/projectsregistry');
  const currentProject = ProjectsRegistry.getCurrentProject();
  // type : <editing, data>
  const {layer={}, relation={}, fid, type='data'} = options;
  let layerId;
  const {father, child, referencedLayer, referencingLayer, id:relationId} = relation;
  if (father !== undefined) layerId = layer.id === father ? child: father;
  else layerId = layer.id === referencedLayer ? referencingLayer: referencedLayer;
  const dataUrl = currentProject.getLayerById(layerId).getUrl(type);
  let  value = fid;
  if (typeof value === 'string') {
    value = value.split('.');
    value = value.length === 1 ? value[0]: value[1];
  }
  const url = `${dataUrl}?relationonetomany=${relationId}|${value}`;
  return XHR.get({
    url
  })
};

module.exports = new RelationsService;
