var SessionsRegistry = function() {
  this._sessions = {};
  
  this.register = function(session) {
    var id = session.getId();
    this._sessions[id] = session;
  };

  this.unregister = function(id) {
    delete this._sessions[id];
  };

  this.getSession = function(id) {
    return this._sessions[id];
  };

  this.setSession = function(id, session) {
    this._sessions[id] = session;
  }
};

module.exports = new SessionsRegistry();
