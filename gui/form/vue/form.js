var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var FormService = require('gui/form/formservice');
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var FormTemplate = require('./formpanel.html');

Vue.filter('startcase', function (value) {
  return _.startCase(value);
});

Vue.filter('lowerCase', function (value) {
  return _.lowerCase(value);
});

Vue.filter('relationplural', function (relation) {
  return (relation.plural) ? relation.plural : _.startCase(relation.name);
});

Vue.validator('email', function (val) {
  return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val)
});

Vue.validator('integer', function (val) {
  return /^(-?[1-9]\d*|0)$/.test(val);
});

var vueComponentOptions = {
  template: null,
  data: function() {
    return {
      state: this.$options.formService.state,
      tools : {
        copypaste: false
      }
    }
  },
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    exec: function(cbk) {
      var relations = this.state.relations || null;
      cbk(this.state.fields, relations);
      if (this.state.editor.getPickedFeature()) {
        this.state.editor.cleanUpPickedFeature();
      }
      GUI.closeForm();
    },
    btnEnabled: function(button) {
      return button.type != 'save' || (button.type == 'save' && this.$validation.valid && this.isValidForm());
    },
    hasFieldsRequired: function() {
      return this.$options.formService._hasFieldsRequired();
    },
    isEditable: function(field){
      return this.$options.formService._isEditable(field);
    },
    isSimple: function(field) {
      return this.$options.formService._isSimple(field);
    },
    isTextarea: function(field) {
      return this.$options.formService._isTextarea(field);
    },
    isSelect: function(field){
      return this.$options.formService._isSelect(field);
    },
    isRadio: function(field) {
      return this.$options.formService._isRadio(field);
    },
    isCheckbox: function(field) {
      return this.$options.formService._isCheckbox(field);
    },
    multiCheckBoxValue: function(evt, field) {
      if (!field.value) {
        filed.value = [];
      }
      if (evt.target.checked) {
        field.push(evt.target.value);
      } else {
        _.remove(field, function(n) {
          return n == evt.target.value;
        });
      }
      console.log(field.value);
    },
    isLayerPicker: function(field){
      return this.$options.formService._isLayerPicker(field);
    },
    isFile: function(field) {
      return this.$options.formService._isFile(field);
    },
    layerPickerPlaceHolder: function(field) {
      return this.$options.formService._getlayerPickerLayerName(field.input.options.layerid);
    },
    pickLayer: function(field, relation) {
      this.checkPickLayer();
      this.$options.formService._pickLayer(field, relation);
    },
    pickLayerInputFieldChange: function(field, relation) {
      this.$options.formService._pickLayerInputFieldChange(field, relation);
    },
    pickLayerToClipBoard: function() {
      var self = this;
      this.checkPickLayer();
      this.$options.formService._pickLayerToClipBoard()
      .then(function() {
        //TODO
      })
    },
    isValidForm: function() {
      var self = this;
      var valid = this.$options.formService._checkFieldsValidation(this.state.fields);
      _.forEach(this.state.relations, function(relation) {
        _.forEach(relation.elements, function(element) {
          valid = valid && self.$options.formService._checkFieldsValidation(element.fields);
        })
      });
      return valid;
    },
    pickLayerInputChange: function() {
      this.$options.formService._cleanUpPickLayer();
    },
    checkPickLayer: function() {
      if (this.$options.formService._pickInteraction) {
        this.$options.formService._cleanUpPickLayer();
      }
    },
    isVisible: function(field) {
      return this.$options.formService._isVisible(field);
    },
    visibleElements: function(relation) {
      return _.filter(relation.elements,function(element){
        return (element.state != 'NEW_DELETED' && element.state != 'OLD_DELETED');
      });
    },
    showRelation: function(relation){
      return this.$options.formService._shouldShowRelation(relation);
    },
    relationPkFieldName: function(relation) {
      return relation.pk;
    },
    isRelationElementDeletable: function(relation,element) {
      if (element.new) {
        return true;
      }
      var min;
      if (relation.type == 'ONE') {
        min = 1;
      }
      else {
        min = Number.NEGATIVE_INFINITY;
      }
      if (relation.min) {
        min = Math.min(min.relation.min);
      }
      return min < relation.elements.length;
    },
    canAddRelationElements: function(relation) {
      var canAdd = true;
      if (relation.type == 'ONE') {
        canAdd = (relation.elements.length) ? false : true; // se è una relazione 1:1 e non ho elementi, lo posso aggiungere, altrimenti no
      }
      else {
        var max = relation.max ? relation.max : Number.POSITIVE_INFINITY;
        canAdd = relation.elements.length < max; 
      }
      return canAdd;
    },
    addRelationElement: function(relation) {
      this.$options.formService._addRelationElement(relation);
    },
    removeRelationElement: function(relation,element){
      this.$options.formService._removeRelationElement(relation, element);
    },
    fieldsSubset: function(fields) {
      var end = Math.min(3,fields.length);
      return fields.slice(0,end);
    },
    fieldsSubsetLength: function(fields) {
      return this.fieldsSubset(fields).length;
    },
    collapseElementBox: function(relation,element) {
      var boxid = this.getUniqueRelationElementId(relation,element);
      if (this.state.elementsBoxes[boxid]) {
        return this.state.elementsBoxes[boxid].collapsed;
      }
    },
    toggleElementBox: function(relation, element) {
      var boxid = this.getUniqueRelationElementId(relation, element);
      this.state.elementsBoxes[boxid].collapsed = !this.state.elementsBoxes[boxid].collapsed;
    },
    getUniqueRelationElementId: function(relation, element) {
      return this.$options.formService.getUniqueRelationElementId(relation, element);
    },
    pasteClipBoardToForm : function() {
      var layerForm = this.$options.formService._getLayerFormFromId();
      this.$options.formService._pasteClipBoardToForm(layerForm);
      this.$validate();
      this.$validate(this.state.relations);
      this.$resetValidation()
    },
    copyToClipBoard : function() {
      this.$options.formService._copyFormToClipBoard();
    },
    onFileChange: function(field, e) {
      // verifico se esiste il tocken di django
      formData = {};
      var csrftoken = this.$cookie.get('csrftoken');
      if (csrftoken) {
        formData.csrfmiddlewaretoken = csrftoken;
      }
      $(e.target).fileupload({
        dataType: 'json',
        formData : formData,
        done: function (e, data) {
          $.each(data.result, function (key, value) {
            field.value = value.filename
          });
        }
      });
      //verifico se è stato caricato un file
      var files = e.target.files || e.dataTransfer.files;
      if (!files.length) {
        return;
      }
    },
    createImage: function(file, field) {
      var reader = new FileReader();
      var self = this;
      reader.onload = function(e) {
        field.value = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    removeImage: function (e) {
      this.image = '';
    },
    checkFileSrc: function(value) {
      var value = value;
      if (_.isNil(value)) {
        value = ''
      }
      return value
    }
  },
  computed: {
    isValid: function(field) {
      return this.$validate(field.name);
    },
    hasRelations: function() {
      return this.state.relations.length;
    }
  },
  ready: function() {
    var self = this;
    if (this.state.relationOne && this.state.isnew) {
      var relationsOne = this.$options.formService._getRelationsOne();
      _.forEach(relationsOne, function(relationOne) {
        if (!relationOne.elements.length) {
          self.addRelationElement(relationOne);
        }
      });
    }
    // al momento lo devo forzare qui
    $('input:file').filestyle({
      buttonText: " Foto",
      buttonName: "btn-primary",
      iconName: "glyphicon glyphicon-camera"
    });
  }
};

// se lo voglio istanziare manualmente
var InternalComponent = Vue.extend(vueComponentOptions);

function FormComponent(options) {

  // proprietà necessarie. In futuro le mettermo in una classe Panel
  // da cui deriveranno tutti i pannelli che vogliono essere mostrati nella sidebar
  base(this, options);
  // qui vado a tenere traccia delle due cose che mi permettono di customizzare
  // vue component e service
  this.vueComponent = vueComponentOptions;
  this.componentService = FormService;
  this.id = options.id; // id del del componente
  merge(this, options);
  // dichiaro l'internal Component
  this.internalComponent = null;
  //template from component
  this.template = options.template || FormTemplate;
  // settor il service del component
  this._service = options.service || new FormService;
  // setto il componente interno
  this.setInternalComponent = function () {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      formService: this._service,
      template: this.template
    });
    this.internalComponent.state = this._service.state;
  };
  // viene richiamato dalla toolbar quando
  // il plugin chiede di mostrare un proprio pannello nella GUI (GUI.showPanel)
  this.mount = function(parent, append) {
    var self = this;
    // richiama il mont padre
    return base(this, 'mount', parent, append)
    .then(function(){
      self._service._setupFields();
      self._service._setupRelationsFields();
      GUI.setModal(true);
    });
  };
}

inherit(FormComponent, Component);

module.exports = FormComponent;

