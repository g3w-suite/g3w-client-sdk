var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var ApplicationService = require('core/applicationservice');
var Service = require('gui/inputs/service');

function DateTimePickerService(options) {
  options = options || {};
  base(this, options);
}

inherit(DateTimePickerService, Service);

var proto = DateTimePickerService.prototype;

proto.getLocale = function() {
  var applicationConfig = ApplicationService.getConfig();
  return applicationConfig.user.i18n ? applicationConfig.user.i18n : 'en';
};

proto.convertQGISDateTimeFormatToMoment = function(datetimeformat) {
  var datetimeformat = datetimeformat.replace('yyyy', 'YYYY');
  var matchDayInDate = datetimeformat.match(/d/g);
  if (matchDayInDate && matchDayInDate.length < 3) {
    datetimeformat = datetimeformat.replace('d'.repeat(matchDayInDate.length), 'D'.repeat(matchDayInDate.length))
  }
  return datetimeformat
};

module.exports = DateTimePickerService;
