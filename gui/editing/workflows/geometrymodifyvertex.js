var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');

function GeometryModifyVertexWorflow(){
  base(this);
}
inherit(GeometryModifyVertexWorflow, Workflow);

var proto = GeometryModifyVertexWorflow.prototype;

module.exports = GeometryModifyVertexWorflow;