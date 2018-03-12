const t = require('core/i18n/i18n.service').t;

const serverErrorParser = function(options) {
  this._error = options.error;
};

const proto = serverErrorParser.prototype;

proto.parse = function() {
  let error_message = null;
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
  let error_obj = (this._error && this._error.responseJSON && this._error.responseJSON.error.data) ? this._error.responseJSON.error.data : null;
  if (error_obj) {
    error_message = "";
    traverseErrorMessage(error_obj);
    error_message = "<h4>"+ t("server_saver_error") + "</h4>" +
    "<h5>" + error_message + "</h5>"
  } else {
    error_message = t("server_saver_error");
  }
  return error_message;
};

module.exports = serverErrorParser;

