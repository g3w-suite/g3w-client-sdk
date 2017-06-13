var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var LayersRegistry = require('core/layers/layersregistry');

function Project(projectConfig) {
  var self = this;
  /* struttura oggetto 'project'
  {
    id,
    type,
    gid,
    name,
    crs,
    extent,
    initextent,
    layerstree,
    overviewprojectgid
  }
  */
  this.state = projectConfig;
  // vado a registrare i layers
  LayersRegistry.init(projectConfig);
  LayersRegistry.setProject(this);

  this.setters = {
    setBaseLayer: function(id) {
      _.forEach(self.state.baselayers, function(baseLayer) {
        baseLayer.visible = (baseLayer.id == id || (baseLayer.fixed === true));
      })
    }
  };

  base(this);
}
inherit(Project, G3WObject);

var proto = Project.prototype;


proto.getState = function() {
  return this.state;
};

// funzione che ritorna id
proto.getId = function() {
  return this.state.id;
};

proto.getTitle = function() {
  return this.state.title;
};

//funzione che ritorna il tipo
proto.getType = function() {
  return this.state.type;
};

proto.getGid = function() {
  return this.state.gid;
};

proto.getOverviewProjectGid = function() {
  return this.state.overviewprojectgid ? this.state.overviewprojectgid.gid : null;
};


proto.getCrs = function() {
  return this.state.crs;
};

proto.getInfoFormat = function() {
  return 'application/vnd.ogc.gml';
};


proto.getLegendUrl = function(layer){
  var url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return this.getWmsUrl()+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=False&ITEMFONTSIZE=10&LAYER='+layer.name;
};

module.exports = Project;
