var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function Relation(config) {
  config = config || {};
  var uniqueSuffix = Date.now();
  this.state = {
    id: config.id || 'id_' + uniqueSuffix ,
    name: config.name || 'name_' + uniqueSuffix,
    father: config.referencedLayer,
    children: config.referencingLayer,
    fatherField: config.fieldRef.referencedField,
    childrenField: config.fieldRef.referencingField,
    type: config.type
  };
  base(this);
}

inherit(Relation, G3WObject);

var proto = Relation.prototype;

proto.getId = function() {
  return this.state.id;
};

proto.setId = function(id) {
  this.state.id = id;
};

proto.getName = function() {
  return this.state.name;
};

proto.setName = function(name) {
  this.state.name = name;
};

proto.getChildren = function() {
  return this.state.children;
};

proto.getFather = function() {
  return this.state.father;
};

proto.getState = function() {
  return this.state;
};


module.exports = Relation;