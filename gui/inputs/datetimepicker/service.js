var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var Service = require('gui/inputs/service');
var DateTimePickerValidator = require('./validator');

function DateTimePickerService(options) {
  options = options || {};
  options.validator = DateTimePickerValidator;
  base(this, options);
}

inherit(DateTimePickerService, Service);

var proto = DateTimePickerService.prototype;

proto.convertQGISDateTimeFormatToMoment = function(datetimeformat) {
  var datetimeformat = datetimeformat.replace('yyyy', 'YYYY');
  var matchDayInDate = datetimeformat.match(/d/g);
  if (matchDayInDate && matchDayInDate.length < 3) {
    datetimeformat = datetimeformat.replace('d'.repeat(matchDayInDate.length), 'D'.repeat(matchDayInDate.length))
  }
  return datetimeformat
};

module.exports = DateTimePickerService;