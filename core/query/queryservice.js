var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');

function QueryService(){
  base(this);
}
inherit(QueryService, G3WObject);

module.exports =  new QueryService;

