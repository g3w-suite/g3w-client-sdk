var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

function SessionsManager() {
  base(this);
  this._sessions = {};
}

inherit(SessionsManager, G3WObject);

var proto = SessionsManager.prototype;

proto.add = function(session) {
  var id = session.getId();
  if (!this._sessions[id])
    this._sessions[id] = session;
};

proto.remove = function(session) {
  _.forEach(this._sessions, function(session) {
    //TODO
  })
};

proto.commit = function(session) {
  var dependencies = null;
  var sessionCommitItemsId;
  if (!dependencies) {
    session.commit();
  } else {
    // recuero tutti gli id delle transazioni da commitare
    sessionCommitItemsId = session.getCommitItems().id;
    _.forEach(dependencies, function(dependency) {
      var inteserctions = _.intersection(dependency.getCommitItems().id, sessionCommitItemsId);
      if (inteserctions.length) {

      }
    })
  }
};


module.exports = SessionsManager;