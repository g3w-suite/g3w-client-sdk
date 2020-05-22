const t = require('core/i18n/i18n.service').t;

const serverErrorParser = function(options={}) {
  this._error = options.error;
};

const proto = serverErrorParser.prototype;

proto.parse = function({type='responseJSON'}={}) {
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
  if (type === 'responseJSON')
    return  (this._error && this._error.responseJSON && this._error.responseJSON.error.message) ? this._error.responseJSON.error.message : t("server_saver_error");
  else if (type=== 'String') return this._error;
  else return t("server_saver_error");
};

module.exports = serverErrorParser;

