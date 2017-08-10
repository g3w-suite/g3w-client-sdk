var inherit = require('core/utils/utils').inherit;
var base = require('core/utils//utils').base;
var G3WObject = require('core/g3wobject');

// manager delle sessioni. Il suo scopo è di verificare al commit
// di una sessione se questa ha altre dipendenze e se si committare tutto in una volta
function SessionsManager() {
  base(this);
  this._sessions = {};
}

inherit(SessionsManager, G3WObject);

var proto = SessionsManager.prototype;

proto.add = function(options) {
  options = options || {};
  var session = options.session;
  var dependencies = options.dependencies || [];
  var id = session ? session.getId() : null;
  if(id && !this._sessions[id]) {
    this._sessions[id] = {
      session: session,
      dependencies: dependencies
    };
  }
};

proto.remove = function(session) {
  var id = session ? session.getId() : null;
  delete this._sessions[id];
};

//questo metodo permette di fare un deep commit
// nel sensop che creerà un commitObj contenente in commit del session padre
// passato come parametro e di tutti i commi dei delle sessioni figli
// di qualsiasi grado di innestamento
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


module.exports = new SessionsManager;