const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const RelationsService = require('core/relations/relationsservice');

function RelationsComponentService(options={}) {
  this.state = {};
  this._service = new RelationsService({
    layer: options.layer
  });
  base(this);

  this.getRelations = function(options={}) {
    return this._service.getRelations(options);
  };

  this.buildRelationTable = function(relations=[]) {
    const columns = Object.keys(relations[0].properties);
    const rows = relations.map(relation => Object.values(relation.properties));
    return {
        columns,
        rows
    }
  };
}

inherit(RelationsComponentService, G3WObject);

module.exports = RelationsComponentService;
