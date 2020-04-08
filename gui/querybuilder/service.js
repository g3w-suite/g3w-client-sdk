const inherit = require('core/utils/utils').inherit;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');

function QueryBuilderService(options={}){
  base(this, options);
  this.layer = options.layer;

};

inherit(QueryBuilderService, G3WObject);

const proto = QueryBuilderService.prototype;

proto.test = function(){

};

proto.all = function() {

};

proto.sample = function(){

};


proto.clear = function(){

};

proto.add = function() {

};

export default QueryBuilderService;
