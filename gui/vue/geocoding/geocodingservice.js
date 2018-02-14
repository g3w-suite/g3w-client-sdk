const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ProjectsRegistry = require('core/project/projectsregistry');
const MapService = require('core/map/mapservice');

function Nominatim(){
  this.url = "http://nominatim.openstreetmap.org";
  this.search = function(query){
    const d = $.Deferred();
    const extent = MapService.extentToWGS84(ProjectsRegistry.getCurrentProject().state.extent);
    const bboxstring = _.join(extent,',');
    const searchUrl = this.url+"/search?viewboxlbrt="+bboxstring+"&bounded=1&format=json&polygon_geojson=1&q="+query;
    $.get(searchUrl,(result) => {
      this.emit("results",result,query);
    });
  };
  
  base(this);
}
inherit(Nominatim,G3WObject);

module.exports = {
  Nominatim: new Nominatim
};
