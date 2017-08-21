var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');
var Relation = require('./relation');

function Relations(options) {
  var self = this;
  options = options || {};
  var relations = options.relations;
  // qui conservo tutte le relazioni
  this._relations = {};
  // qui mi serve per costruire tutte le relazioni tra i layers
  this._relationsInfo = {
    childrens: {}, // contiene larry dei figli (id unici)
    fathers: {}, // contiene l'array dei padri (unici)
    father_children: {} // contiene oggetti informazione padre figlio relazione
  };
  var relation;
  //vado a polpolare le relazioni
  _.forEach(relations, function(relationConfig) {
    // vado a creare la relazione
    relation = new Relation(relationConfig);
    // aggiungo all'oggetto relations
    self._relations[relation.getId()] = relation;
  });
  this._createRelationsInfo();
  base(this);
}

inherit(Relations, G3WObject);

var proto = Relations.prototype;

proto._createRelationsInfo = function() {
  var self = this;
  var father;
  var children;
  _.forEach(this._relations, function(relation, relationKey) {
    father = relation.getFather();
    children = relation.getChildren();
    self._relationsInfo.father_children[father+children] = relationKey;
    if (!self._relationsInfo.fathers[father]) {
      self._relationsInfo.fathers[father] = [];
    }
    if (!self._relationsInfo.childrens[children]) {
      self._relationsInfo.childrens[children] = [];
    }
    self._relationsInfo.fathers[father].push(children);
    self._relationsInfo.childrens[children].push(father);
  });
};

proto._clearRelationsInfo = function() {
  this._relationsInfo = {
    childrens: {},
    fathers: {},
    father_children: {}
  };
};

proto._reloadRelationsInfo = function() {
  this._clearRelationsInfo();
  this._createRelationsInfo();
};

proto.getRelations = function() {
  return this._relations;
};

proto.setRelations = function(relations) {
  this._relations = _.isArray(relations) ? relations : [];
};

proto.getRelationById = function(id) {
  return this._relations[id];
};

proto.getRelationByFatherChildren = function(father, children) {
  var relationId = this._relationsTree.father_children[father+children];
  return this.getRelationById(relationId);
};

proto.addRelation = function(relation) {
  if (relation instanceof Relation) {
    this._relations[relation.getId()] = relation;
    this._reloadRelationsInfo();
  }
};

proto.removeRelation = function(relation) {
  var relationId;
  if (relation instanceof Relation) {
    relationId = relation.getId();
    delete this._relations[relationId];
    this._reloadRelationsInfo();
  }
};

// vado a recuperare i figli a seconda se passato il parametro fatherId o no
proto.getChildrens = function(fatherId) {
  if (!this.isFather(fatherId)) {
    return null;
  }
  if (!fatherId)
    return this._relationsInfo.childrens;
  return this._relationsInfo.fathers[fatherId];
};

// vado a recuperare i figli a seconda se passato il parametro childrenId o no
proto.getFathers = function(childrenId) {
  if (!this.isChildren(childrenId)) {
    return null;
  }
  if (!childrenId)
    return this._relationsInfo.childrens;
  return this._relationsInfo.childrens[childrenId];
};

// verifico se è un figlio o no
proto.isChildren = function(id) {
  return !!this._relationsInfo.childrens[id];
};

// verifico se è un padre o no
proto.isFather = function(id) {
  return !!this._relationsInfo.fathers[id];
};

module.exports = Relations;