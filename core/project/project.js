var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Projections = require('core/geo/projections');


function Project(projectConfig) {
  var self = this;
  /* struttura oggetto 'project'
  {
    id,
    type,
    gid,
    name,
    crs,
    proj4,
    extent,
    initextent,
    layerstree,
    overviewprojectgid
  }
  */
  this.state = projectConfig;

  this.projection = Projections.get(this.state.crs,this.state.proj4);

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
  return this.projection.getCode();
};

proto.getProjection = function() {
  return this.projection;
};

proto.getInfoFormat = function() {
  return 'application/vnd.ogc.gml';
};

proto.getWmsUrl = function() {
  var url;
  if (this.state.source && this.state.source.type == 'wms' && this.state.source.url){
    url = this.state.source.url
  }
  else {
    url = this.state.WMSUrl;
  }
  return url;
};

proto.getLegendUrl = function() {
  var url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return url+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=True&ITEMFONTSIZE=10&WIDTH=300&LAYER='+this.getWMSLayerName();
};


proto.getLegendUrl = function(layer){
  var url = this.getWmsUrl();
  sep = (url.indexOf('?') > -1) ? '&' : '?';
  return this.getWmsUrl()+sep+'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&SLD_VERSION=1.1.0&FORMAT=image/png&TRANSPARENT=true&ITEMFONTCOLOR=white&LAYERTITLE=False&ITEMFONTSIZE=10&LAYER='+layer.name;
};

module.exports = Project;
