// oggetto base utilizzato per i mixins
const InputMixins = require('gui/inputs/input');
const getUniqueDomId = require('core/utils/utils').getUniqueDomId;
const Service = require('../service');
const GUI = require('gui/gui');
const MediaMixin = require('gui/vue/vue.mixins').mediaMixin;

const MediaInput = Vue.extend({
  mixins: [InputMixins, MediaMixin],
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
      value: null,
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
      var csrftoken = this.$cookie.get('csrftoken');
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
            self.value = response.value;
            self.media = {...self.getMediaType(response.mime_type)};
            self.state.value =  {
              value: self.value,
              mime_type: response.mime_type
            };
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
      this.value = this.state.value = null;
      this.setFileNameInput();
    },
    setFileNameInput() {
      $(this.$el).find('.form-control').val(this.filename);
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
      });
      this.setFileNameInput();
    })
  }
});

module.exports = MediaInput;
