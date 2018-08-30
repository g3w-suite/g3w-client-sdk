// oggetto base utilizzato per i mixins
const InputMixins = require('gui/inputs/input');
const Service = require('../service');
const GUI = require('gui/gui');

const IntegerInput = Vue.extend({
  mixins: [InputMixins],
  data: function() {
    return {
      service: new Service({
        state: this.state
      }),
      media: {
        type: null,
        options: {
          format: null
        }
      },
      value: null
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
      var spinnerContainer = $('#media-spinner');
      //check if token exist di django
      var csrftoken = this.$cookie.get('csrftoken');
      if (csrftoken) {
        formData.csrfmiddlewaretoken = csrftoken;
      }
      GUI.showSpinner({
        container: spinnerContainer,
        id: 'medialoadspinner',
        style: 'white',
        center: true
      });
      $(e.target).fileupload({
        dataType: 'json',
        formData : formData,
        done: (e, data) => {
          const response = data.result[fieldName];
          if (response) {
            self.value = response.value;
            self.media = {...self.getMediaType(response.mime_type)};
            self.state.value =  {
              value: self.value,
              mime_type: response.mime_type
            };
            self.change();
          }
        },
        fail: function() {
          $(this).siblings('.bootstrap-filestyle').find('input').val(field.value);
          GUI.notify.error('Si è verificato un errore nel caricamento')
        },
        always: function() {
          GUI.hideSpinner('medialoadspinner');
        }
      });

    },
    getMediaType(mime_type) {
      let media = {
        type: null,
        options: {}
      };
      switch (mime_type) {
        case 'image/gif':
        case 'image/png':
        case 'image/jpeg':
        case 'image/bmp':
          media.type = 'image';
          break;
        case 'application/pdf':
          media.type = 'pdf';
          break;
        case 'video/mp4':
          media.type = 'video';
          media.options.format = mime_type;
          break;
        default:
      }
      return media;
    },
    createImage: function(file, field) {
      var reader = new FileReader();
      reader.onload = function(e) {
        field.value = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    checkFileSrc: function(value) {
      var value = value;
      if (_.isNil(value)) {
        value = ''
      }
      return value
    },
    clearMedia() {
      $(this.$el).find('input:file').filestyle('clear');
      this.value = this.state.value = null;
    }
  },
  created() {
    if (this.state.value) {
      this.value = this.state.value.value;
      this.media = this.getMediaType(this.state.value.mime_type);
    }
  },
  mounted() {
    this.$nextTick(() => {
      $(this.$el).find('input:file').filestyle({
        buttonText: "...",
        buttonName: "btn-primary",
        icon: false
      })
    })
  }
});

module.exports = IntegerInput;
