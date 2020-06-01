const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const ApplicationService = require('core/applicationservice');
const RelationsService = require('core/relations/relationsservice');

function RelationsComponentService(options={}) {
  this.state = {};
  base(this);

  this.getRelations = function(options={}) {
    return RelationsService.getRelations(options);
  };

  this.buildRelationTable = function(relations=[], id) {
    const layer = ApplicationService.getCurrentProject().getLayerById(id);
    const headers = layer.getTableHeaders();
    let columns = null;
    let rows = [];
    if (relations.length) {
      const properties = Object.keys(relations[0].properties);
      columns = headers.filter(header => properties.indexOf(header.name) !==-1);
      rows = relations.map(relation => {
        return columns.map(column => {
          return relation.properties[column.name]
        })
      });
      columns = columns.map(column => column.label);
    }
    return {
      columns,
      rows
    }
  };
}

inherit(RelationsComponentService, G3WObject);

module.exports = RelationsComponentService;
