var serverErrorParser = function(options) {
  this._error = options.error;
};

var proto = serverErrorParser.prototype;

proto.parse = function() {
  var error_message = null;
  function traverseErrorMessage(obj) {
    _.forIn(obj, function (val, key) {
      if(_.isArray(val)) {
        error_message = val[0];
      }
      if(_.isObject(val)) {
        traverseErrorMessage(obj[key]);
      }
      if (error_message) {
        return false;
      }
    });
  }
  var error_obj = (this._error && this._error.responseJSON && this._error.responseJSON.error.data) ? this._error.responseJSON.error.data : null;
  if (error_obj) {
    error_message = "";
    traverseErrorMessage(error_obj);
    error_message = "<h4>Errore nel salvataggio sul server</h4>" +
    "<h5>" + error_message + "</h5>"
  } else {
    error_message = "Errore nel salvataggio sul server";
  }
  return error_message;
};

module.exports = serverErrorParser;

