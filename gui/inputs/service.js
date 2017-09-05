function Service(options) {
  this.state = {
    //da decidere
  }
}

var proto = Service.prototype;
proto.getState = function() {
  return this.state;
};

proto.setState = function(state) {
  this.state = _.isObject(state) ? state : {};
};

module.export = Service;