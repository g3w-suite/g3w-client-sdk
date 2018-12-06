// oggetto base utilizzato per i mixins
const InputMixins = require('gui/inputs/input');
const getUniqueDomId = require('core/utils/utils').getUniqueDomId;
const Service = require('../service');
const MediaField = require('gui/fields/fields').media_field;
const GUI = require('gui/gui');

const MediaInput = Vue.extend({
  mixins: [InputMixins],
  components: {
    'g3w-media': MediaField
  },
  data: function() {
    return {
      service: new Service({
        state: this.state
      }),
      data: {
        value: null,
        mime_type: null
      },
      mediaid: `media_${getUniqueDomId()}`,
      loading: false
    }
  },
  template: require('./media.html'),
  methods: {
    onChange: function(e) {
      const self = this;
      const fieldName = this.state.name;
      var formData = {
        name: fieldName
      };
      //check if token exist di django
      const csrftoken = this.$cookie.get('csrftoken');
      if (csrftoken) {
        formData.csrfmiddlewaretoken = csrftoken;
      }
      this.loading = true;
      $(e.target).fileupload({
        dataType: 'json',
        formData : formData,
        done: (e, data) => {
          const response = data.result[fieldName];
          if (response) {
            self.data.value = response.value;
            self.data.mime_type = response.mime_type;
            self.state.value =  self.data;
            self.setFileNameInput();
            self.change();
          }
        },
        fail: () => {
          $(this).siblings('.bootstrap-filestyle').find('input').val(field.value);
          GUI.notify.error('Si è verificato un errore nel caricamento')
        },
        always: () => {
          this.loading = false;
        }
      });
    },
    createImage: function(file, field) {
      var reader = new FileReader();
      reader.onload = function(e) {
        field.value = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    checkFileSrc: function(value) {
      if (_.isNil(value)) {
        value = ''
      }
      return value
    },
    clearMedia() {
      this.data.value = this.data.mime_type = this.state.value = null;
      this.setFileNameInput();
    },
    setFileNameInput() {
      $(this.$el).find('.form-control').val(this.filename);
    }
  },
  created() {
    if (this.state.value) {
      this.data.value = this.state.value.value;
      this.data.mime_type = this.state.value.mime_type;
    }
  },
  mounted() {
    this.$nextTick(() => {
      $(this.$el).find('input:file').filestyle({
        buttonText: "...",
        buttonName: "btn-primary",
        icon: false
      });
      this.setFileNameInput();
    })
  }
});

module.exports = MediaInput;
