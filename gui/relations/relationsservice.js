const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const RealtionsService = require('core/relations/relationsservice');

function RelationsComponentService() {
  this.state = {};
  this._service = new RealtionsService();
  base(this);

  this.getRelations = function(options) {
    return this._service.getRelations(options)
  };

  this.buildRelationTable = function(relations) {
    const columns = _.keys(relations[0]);
    const rows = [];
    relations.forEach((relation) => {
      rows.push(_.values(relation));
    });
    return {
      columns: columns,
      rows: rows
    }
  };
}

inherit(RelationsComponentService, G3WObject);

module.exports = RelationsComponentService;
