var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Component = require('gui/vue/component');
var Service = require('gui/form/formservice');
var base = require('core/utils/utils').base;
var Template = require('./templateform.html');

// FILTRI VUE

Vue.filter('startcase', function (value) {
  return _.startCase(value);
});

Vue.filter('lowerCase', function (value) {
  return _.lowerCase(value);
});

Vue.filter('relationplural', function (relation) {
  return (relation.plural) ? relation.plural : _.startCase(relation.name);
});

//FINE FILTRI VUE

//VUE VALIDATOR
// li manteniamo come commenti giusto per riprendere le Regex nel futuro validatore
/*Vue.validator('email', function (val) {
  return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(val)
});

Vue.validator('integer', function (val) {
  return /^(-?[1-9]\d*|0)$/.test(val);
});*/

//FINE VUE VALIDATOR

//Definisco l'oggetto che contiene i dati necessari per instanziare un vue component
var vueComponentOptions = {
  template: null,
  data: function() {
    return {
      state: null,
      tools : {
        copypaste: false
      }
    }
  },
  components: {
    //è possibile inserire componenti custom dai vari plugin,
  },
  transitions: {'addremovetransition': 'showhide'},
  methods: {
    exec: function(cbk) {
      var relations = this.state.relations || null;
      cbk(this.state.fields, relations);
    },
    btnEnabled: function(button) {
      return button.type != 'save' || (button.type == 'save' && this.isValidForm());
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
    isSelectOptionsNull : function(value) {
      if (_.isNil(value)) {
        return 'null';
      } else {
        return value;
      }
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
    },
    isLayerPicker: function(field){
      return this.$options.formService._isLayerPicker(field);
    },
    removeImage: function(field) {
      field.value = null;
    },
    isImage: function(field) {
      return this.$options.formService._isImage(field);
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
        if (self.showRelation(relation)) {
          _.forEach(relation.elements, function (element) {
            // non tengo conto dell'elementi della relazione eliminati
            if (element.state.indexOf('DELETE') > -1) {return true}
            valid = valid && self.$options.formService._checkFieldsValidation(element.fields);
          })
        }
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
    visibleElementsLength: function(relation) {
      return this.visibleElements(relation).length;
    },
    showRelation: function(relation) {
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
    removeRelationElement: function(relation, element){
      this.$options.formService._removeRelationElement(relation, element);
    },
    visibleElementFields: function(fields) {
      var self = this;
      return _.filter(fields, function (field) {
        return self.isVisible(field);
      })
    },
    fieldsSubset: function(fields) {
      var attributes = _.filter(fields, function(attribute) {
        return attribute.type != 'image';
      });
      var end = Math.min(3, attributes.length);
      return attributes.slice(0, end);
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
    onSelectChange: function(field, evt) {
      field.value = evt.target.value;
    },
    onFileChange: function(field, relationIndex, e) {
      var formData = {};
      var spinnerContainer;
      // verifico se esiste il token di django
      var csrftoken = this.$cookie.get('csrftoken');
      if (csrftoken) {
        formData.csrfmiddlewaretoken = csrftoken;
      }
      if (relationIndex) {
        spinnerContainer = $('#foto-spinner'+relationIndex);
      } else {
        spinnerContainer = $('#foto-spinner');
      }
      GUI.showSpinner({
        container: spinnerContainer,
        id: 'fotoloadspinner',
        style: 'white',
        center: true
      });
      $(e.target).fileupload({
        dataType: 'json',
        formData : formData,
        done: function (e, data) {
          $.each(data.result, function (key, value) {
            field.value = value.filename
          });
        },
        fail: function() {
         $(this).siblings('.bootstrap-filestyle').find('input').val(field.value);
         GUI.notify.error('Si è verificato un errore nel caricamento')
        },
        always: function() {
          GUI.hideSpinner('fotoloadspinner');
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
    setImageStyleInput: function() {
      this.$options.formService._setImageStyleInput();
    }
  },
  computed: {
    isValid: function(field) {
      return this.$validate(field.name);
    },
    hasRelations: function() {
      return this.state.relations.length;
    },
    // campo fields
    fields: function() {
      return this.state.fields;
    }
  },
  //aggiunta per  permettere al copia e incolla
  // di aggiornare stile upload image input
  watch: {
    'state.fields': function() {
      this.setImageStyleInput();
    }
  },
  mounted: function() {
    var self = this;
    if (this.state.relationOne && this.state.isnew) {
      var relationsOne = this.$options.formService._getRelationsOne();
      _.forEach(relationsOne, function(relationOne) {
        if (!relationOne.elements.length) {
          self.addRelationElement(relationOne);
        }
      });
    }
    this.$nextTick(function(){
      self.setImageStyleInput();
      self.$options.formService.postRender();
    });
  },
  beforeDestroy: function() {
    // prima di distruggerlo mi assicuro che venga rimosso l'eventuale picklayer interaction
    this.$options.formService._cleanUpPickLayer();
  }
};

function FormComponent(options) {
  var options = options || {};
  options.id = options.id || 'form';
  // qui vado a tenere traccia delle tre cose che mi permettono di customizzare
  // vue component, service e template
  // proprietà necessarie. In futuro le mettermo in una classe Panel
  // da cui deriveranno tutti i pannelli che vogliono essere mostrati nella sidebar
  base(this, options);
  //settor il service del component (lo istanzio tutte le volte che inizializzo un componente
  var service = options.service ?  new options.service : new Service;
  var vueComponent = options.vueComponentOptions || vueComponentOptions;
  // lo devo fare per problemi con compoents
  this.vueComponent = this.createVueComponent(vueComponent);
  this.setService(service);
  var template = options.template || Template;
  this.setInternalComponentTemplate(template);
  // funzione che permette di settare il componente interno
  this.setInternalComponent = function() {
    var InternalComponent = Vue.extend(this.vueComponent);
    this.internalComponent = new InternalComponent({
      formService: this.getService(),
      template: this.getInternalTemplate()
    });
    // associo lo state del componente interno a quello del service
    // perchè le funzioni che maipolano lo stato del componente sono delegate al service nella
    // maggior parte dei casi
    this.internalComponent.state = this.getService().state;
  };
  // Sovrascrivo il metodo mount padre. Viene richiamato dalla toolbar quando
  // il plugin chiede di mostrare un proprio pannello nella GUI (GUI.showPanel)
  this.mount = function(parent, append) {
    var self = this;
    // richiama il mont padre
    return base(this, 'mount', parent, append)
      // una volta footo il mount
    .then(function() {
      self.getService().setupFields();
      self.getService().setupRelationsFields();
      // setto il modale a true
      GUI.setModal(true);
    });
  };

  this.layout = function(width,height) {
    var headerHeight = $(this.internalComponent.$el).find(".g3w-form-component_header").height();
    var bodyHeight = height - headerHeight;
    $(this.internalComponent.$el).find(".g3w-form-component_body").height(bodyHeight);
    $(".nano").nanoScroller();
  }
}

inherit(FormComponent, Component);

module.exports = FormComponent;

