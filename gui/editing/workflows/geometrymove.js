var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');

function GeometryMoveWorflow(){
  base(this);
}
inherit(GeometryMoveWorflow, Workflow);

var proto = GeometryMoveWorflow.prototype;

module.exports = GeometryMoveWorflow;