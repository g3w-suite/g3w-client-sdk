var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');

function GeometryDeleteWorflow(){
  base(this);
}
inherit(GeometryDeleteWorflow, Workflow);

var proto = GeometryDeleteWorflow.prototype;

module.exports = GeometryDeleteWorflow;