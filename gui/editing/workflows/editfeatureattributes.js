var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var Workflow = require('core/workflow/workflow');

function EditFeatureAttributesWorkflow(){
  base(this);
}
inherit(EditFeatureAttributesWorkflow, Workflow);

var proto = EditFeatureAttributesWorkflow.prototype;

module.exports = EditFeatureAttributesWorkflow;