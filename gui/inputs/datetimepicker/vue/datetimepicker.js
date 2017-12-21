// oggetto base utilizzato per i mixins
var Input = require('gui/inputs/input');
var Service = require('../service');

var DateTimePickerInput = Vue.extend({
  mixins: [Input],
  data: function() {
    // creo un unico valore per identificare id
    var uniqueValue = Date.now();
    var fielddatetimeformat =  this.state.input.options[0].fieldformat.replace('yyyy','YYYY').replace('dd','DD');
    // in base al fielddatetimeformat creo la data tramite moment
    var date = moment(this.state.value, fielddatetimeformat, true).isValid() ? moment(this.state.value, fielddatetimeformat).toDate() : null;
    return {
      service: new Service({
        state: this.state,
        validatorOptions : {
          fielddatetimeformat: fielddatetimeformat
        }
      }),
      value: date,
      iddatetimepicker: 'datetimepicker_'+ uniqueValue,
      idinputdatetimepiker: 'inputdatetimepicker_'+ uniqueValue
    }
  },
  template: require('./datetimepicker.html'),
  methods: {
    timeOnly : function() {
      return !this.state.input.options[0].date;
    }
  },
  mounted: function() {
    var self = this;
    this.$nextTick(function() {
      var locale = self.service.getLocale();
      var datetimedisplayformat = self.service.convertQGISDateTimeFormatToMoment(self.state.input.options[0].displayformat);
      var datetimefieldformat = self.service.convertQGISDateTimeFormatToMoment(self.state.input.options[0].fieldformat);
      $(function() {
        $('#'+ self.iddatetimepicker).datetimepicker({
          defaultDate: self.value,
          format: datetimedisplayformat,
          toolbarPlacement: 'top',
          widgetPositioning: {
            vertical: 'bottom',
            horizontal: 'left'
          },
          showClose: true,
          locale: locale
        });
      });
      $('#'+self.iddatetimepicker).on("dp.change", function (e) {
        if (_.isEmpty(_.trim($('#'+self.idinputdatetimepiker).val())))
          self.state.value =  null;
        else {
          self.state.value =  moment(e.timeStamp).format(datetimefieldformat);
        }
        self.change();
      });
      $('#'+self.iddatetimepicker).on("dp.show", function (e) {
        self.$emit('datetimepickershow');
      });
      $('#'+self.iddatetimepicker).on("dp.hide", function (e) {
        self.$emit('datetimepickershow');
      });
    });
  }
});

module.exports = DateTimePickerInput;
