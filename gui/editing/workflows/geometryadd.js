var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');
var Step = require('core/workflow/step');

function GeometryAddWorflow(){
  base(this);

  this._steps = []
}
inherit(GeometryAddWorflow, Workflow);

var proto = GeometryAddWorflow.prototype;

module.exports = GeometryAddWorflow;