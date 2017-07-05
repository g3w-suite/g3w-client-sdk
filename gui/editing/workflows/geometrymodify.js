var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');

function GeometryModifyWorflow(){
  base(this);
}
inherit(GeometryModifyWorflow, Workflow);

var proto = GeometryModifyWorflow.prototype;

module.exports = GeometryModifyWorflow;