// oggetto base utilizzato per i mixins
const Input = require('gui/inputs/input');
const Service = require('../service');

const DateTimePickerInput = Vue.extend({
  mixins: [Input],
  data: function() {
    // creo un unico valore per identificare id
    const uniqueValue = Date.now();
    // in base al fielddatetimeformat creo la data tramite moment
    return {
      service: new Service({
        state: this.state
      }),
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
    this.$nextTick(() => {
      const fielddatetimeformat =  this.state.input.options[0].fieldformat.replace('yyyy','YYYY').replace('dd','DD');
      this.service.setValidatorOptions({
        fielddatetimeformat: fielddatetimeformat
      });
      const date = moment(this.state.value, fielddatetimeformat, true).isValid() ? moment(this.state.value, fielddatetimeformat).toDate() : null;
      const locale = this.service.getLocale();
      const datetimedisplayformat = this.service.convertQGISDateTimeFormatToMoment(this.state.input.options[0].displayformat);
      const datetimefieldformat = this.service.convertQGISDateTimeFormatToMoment(this.state.input.options[0].fieldformat);
      $(() => {
        $('#'+ this.iddatetimepicker).datetimepicker({
          defaultDate: date,
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
      $('#'+this.iddatetimepicker).on("dp.change", (e) => {
        const newDate = $('#'+this.idinputdatetimepiker).val();
        if (_.isEmpty(_.trim(newDate)))
          this.state.value =  null;
        else {
          this.state.value =  moment(newDate).format(datetimefieldformat);
        }
        this.change();
      });
      $('#'+this.iddatetimepicker).on("dp.show", (e) => {
        this.$emit('datetimepickershow');
      });
      $('#'+this.iddatetimepicker).on("dp.hide", (e) => {
        this.$emit('datetimepickershow');
      });
    });
  }
});

module.exports = DateTimePickerInput;
