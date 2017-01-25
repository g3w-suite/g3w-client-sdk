var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var GUI = require('gui/gui');
var G3WObject = require('core/g3wobject');
var PickCoordinatesInteraction = require('g3w-ol3/src/interactions/pickcoordinatesinteraction');
var ClipBoard = require('core/clipboardservice');
var QueryService = require('core/query/queryservice');

var Inputs = {};
Inputs.STRING = 'string';
Inputs.INTEGER = 'integer';
Inputs.FLOAT = 'float';
Inputs.BOOLEAN = 'boolean';

Inputs.defaults = {};
Inputs.defaults[Inputs.STRING] = "";
Inputs.defaults[Inputs.INTEGER] = 0;
Inputs.defaults[Inputs.FLOAT] = 0.0;
Inputs.simpleFieldTypes = [Inputs.STRING,Inputs.INTEGER,Inputs.FLOAT];

Inputs.TEXTAREA = 'textarea';
Inputs.SELECT = 'select';
Inputs.RADIO = 'radio';
Inputs.CHECKBOX = 'checkbox';
Inputs.LAYERPICKER = 'layerpicker';
Inputs.IMAGE = 'image';

Inputs.specialInputs = [Inputs.TEXTAREA, Inputs.SELECT, Inputs.RADIO, Inputs.CHECKBOX, Inputs.LAYERPICKER, Inputs.IMAGE];

function FormService() {
  this._actions = {};
  this.state = null;
  this._pickInteraction = null;
  this.setters = {
    setInitForm: function(options) {
      this._setInitForm(options);
    },
    // setter sul cambio dellle relazioni del form
    setFormRelations: function (relations) {
      this.state.relations = relations;
    },
    // setter sul cambio dei campi
    setFormFields: function (fields) {
      this.state.fields = fields;
    },
    setupFields: function() {
      this._setupFields();
    },
    setupRelationsFields: function() {
      this._setupRelationsFields();
    },
    // setter sull'inserimento dei dati del form
    setFormData: function(fields, relations) {
      this.setFormFields(fields);
      this.setFormRelations(relations);
    },
    // setter del singolo field
    setField: function(field) {
    },
    // settere dello state
    setState: function(state) {
      this._setState(state);
    },
    // setter sull'aggiunta di un'azione sul form
    addActionsForForm: function (actions) {
      // un opportunità per i listener per aggiungere azioni a form
    },
    postRender: function (element) {
      // un opportunità per i listener di intervenire sul DOM
    }
  };
  // inizializzo il form con l'opzioni passate dall'editor al momento del'apertura del form
  this._setInitForm = function(options) {
    this.provider = options.provider || null; // è l' editor che lo chiama
    this.formId = options.formId;
    this.name = options.name; // nome del form
    this.dataid = options.dataid; // "accessi", "giunzioni", ecc.
    this.editor = options.editor || {};
    this.relationOne = options.relationOne || null;
    this.pk = options.pk || null; // eventuale chiave primaria (non tutti i form potrebbero avercela o averne bisogno
    this.tools = options.tools || [];
    this.isnew = (!_.isNil(options.isnew) && _.isBoolean(options.isnew)) ? options.isnew : true;
    this._defaults = options.defaults || Inputs.defaults;
    this.buttons = options.buttons;
    // clipboard
    this._clipBoard = ClipBoard;
    //mi server per estrarre il nome del layer dall'id del form
    // in quanto l'id è creato univoco ma riposrta al suo interno
    // il nome del layer
    var formLayer = this.formId.split('form')[0];
    this._pickedPromise = null;
    // setto lo stato
    this.state = {
      fields: null,
      relations: null,
      editor: this.editor,
      isnew: this.isnew,
      buttons: this.buttons,
      tools: {},
      relationOne: this.relationOne,
      canpaste: _.has(this._clipBoard._data, formLayer)
    };
    //chiamo i setter
    this.setFormFields(options.fields);
    this.setFormRelations(options.relations);
    var elementsBoxes = this.getUniqueRelationsElementId();
    this.state.elementsBoxes = elementsBoxes;
    // qui associo lo state del pannello allo ste del form
    this._setFormTools(this.tools);
    this.editor.setFormService(this);
  };
  this.cleanStateAfterCommit = function(newRelationIds) {
    // verifico che ci sia stato un aggiunta di relazioni
    var addedRelations = (newRelationIds && newRelationIds.length > 0) ? newRelationIds[0].relations :  {};
    // cliclo sulle relazioni e faccio "pulizia"
    _.forEach(this.state.relations, function (relation) {
      var addedRelation = addedRelations[relation.name];
      _.forEach(relation.elements, function (element, index) {
        // verifico gli elementi che sono stati cancellati e cancello
        if(element.state.indexOf('DELETE') > -1) {
          relation.elements.splice(index, 1);
        }
        // nela caso di elementi nuovi inseriti
        if (element.state == 'NEW') {
          _.forEach(addedRelation, function(newElement){
            if (element.id == newElement.clientid) {
              element.id = newElement.id;
              return false
            }
          });
          // assegno lo stato OLD
          element.state = 'OLD';
        }
      });
    });
  };
  this.createPickInteraction = function() {
    this._pickInteraction = new PickCoordinatesInteraction;
    return this._pickInteraction;
  };
  this.getState = function () {
    return this.state;
  };

  this._setState = function(state) {
    this.state = state;
  };
  // funzione che supporta la validazione dei campi obbigatori al fine di abliltare o meno il Salva
  this._checkFieldsValidation = function(fields) {
    var self = this;
    var valid = true;
    var fieldValid = true;
    _.forEach(fields, function(field) {
      if (self._isEditable(field) && self._isVisible(field) && field.validate && field.validate.required) {
        if (_.isNil(field.value) || !_.trim(field.value)) {
          if (!self._isSelect(field)) {
            fieldValid = false;
          }
        }
        valid = valid && fieldValid;
      }
    });
    return valid;
  };
  //funzione che retituisce i fields
  this.getFields = function() {
    return this._fields;
  };
  // funzione che restituisce se nella feture(nel layer) è prevista una relazione ONE
  this._getRelationsOne = function() {
    // overwrite from plugin
    var self = this;
    var relationsOne = [];
    _.forEach(this.state.relations, function(relation, index) {
      if (relation.type == 'ONE') {
        relationsOne.push(self.state.relations[index]);
      }
    });
    return relationsOne;
  };
  //funzione che mi server per estrarre il layer name dall'id del form
  // utile per il clipboard al fine del copia e incolla
  this._getLayerFormFromId = function() {
    return this.formId.split('form')[0];
  };
  //funzione che clona i dati del form per il copia e incolla
  this._copyFormToClipBoard = function() {
    var formData = _.cloneDeep(this.state);
    this._clipBoard.set(this.formId, formData);
    this.state.canpaste = true;
    return true;
  };

  this._setFieldValueLayerFromToRelationField = function(relation, name) {
     ('questa funzione deve essere sovrascritta dal plugin al momento');
  };

  this._checkIfFieldIsOverwritable = function(fieldName, fieldsdArray) {
    var check = null;
    _.forEach(fieldsdArray, function(field) {
      if (!_.isNil(field[fieldName])) {
        check = field[fieldName]
      }
    });
    return check;
  };
  // funzione utlizzazta al fine di copiare i dati di un altra feature seleziona
  // evitando di scrivere i campi non sovrascrivibili. Rimasta con il nome vecchio riferita solo alla primary key
  this._pasteStateWithoutPk = function(fields, relations) {
    //prendo vector layer
    var self = this;
    var layerFields = [];
    var copyAndPasteFieldsNotOverwritable = self.editor.getcopyAndPasteFieldsNotOverwritable();
    var relationFields = {};
    // verifico se sono stati settati campi che non devono essere sovrascitti dal copia e incolla
    // è settato dall'editor specifico
    if (!_.isNil(copyAndPasteFieldsNotOverwritable.layer)) {
      layerFields = copyAndPasteFieldsNotOverwritable.layer;
    }
    if (!_.isNil(copyAndPasteFieldsNotOverwritable.relations)) {
      relationFields = copyAndPasteFieldsNotOverwritable.relations;
    }
    // verifico i fields da non modificare sul layer
    var orginalField;
    _.forEach(fields, function(field, index) {
      orginalField = self._checkIfFieldIsOverwritable(field.name, layerFields);
      //verifico se è una chiave prmaria il campo
      if (self.pk == field.name) {
        fields[index].value = self.isnew ? null : self.state.fields[index].value;
      } else if (!_.isNull(orginalField)) { // caso in cui non è la chiave primaria
        fields[index].value = (orginalField && self.isnew) ? undefined : self.state.fields[index].value;
      }
    });
    // verifico i fileds delle relazioni da non sovrascrivere
    _.forEach(relations, function(relation, relationIndex) {
      _.forEach(relation.elements, function(element, elementIndex) {
        /// aggiungo allo stato della relazione copiata NEW
        relations[relationIndex].elements[elementIndex].state = 'NEW';
        _.forEach(element.fields, function(field, fieldIndex) {
          _.forEach(relationFields[relation.name], function(relationField) {
            if (field.name == relationField) {
              relations[relationIndex].elements[elementIndex].fields[fieldIndex].value = undefined;
            }
          });
        });
      })
    });
    // setto i nuovi fields e relations lasciando quelli vecchi
    this.setFormData(fields, relations);
    var elementsBoxes = this.getUniqueRelationsElementId(false);
    this.state.elementsBoxes = elementsBoxes;
    return true;
  };
  // funzione che server per incollare i dati dalla clipboard nel form
  this._pasteClipBoardToForm = function(layerForm) {
    var formData = this._clipBoard.get(layerForm);
    this._pasteStateWithoutPk(formData.fields, formData.relations);
    this.state.canpaste = false;
  };

  // funzione che verifica se la featuare su cui stiamo lavorando
  // è nuova o vecchia
  this._isNew = function(){
    return this.isnew;
  };
  // funzione che verifa se il campo è obbligatorio o no
  this._hasFieldsRequired = function() {
    var someFieldsRequired = _.some(this.state.fields, function(field){
      return field.validate && field.validate.required;
    });
    var someRelationsRequired = _.some(this.state.relations,function(relation){
      return relation.validate && relation.validate.required;
    });
    return someFieldsRequired || someRelationsRequired;
  };

  // VERIFICA CAMPI

  // funzione che restituisce true/false a seconda se il campo è visibile o no
  this._isVisible = function(field) {
    return !(!field.editable && (field.value == "" || _.isNull(field.value))) && field.name !=this.pk;
  };
  //verifica se il campo è editabile o no
  this._isEditable = function(field) {
    return field.editable;
  };
  // verifica se il campo è considerato tra i seimple(es text)
  this._isSimple = function(field) {

    if (_.includes(Inputs.specialInputs, field.input.type)){
      return false;
    }
    return _.includes(Inputs.simpleFieldTypes, field.type)
  };
  // verifica se l'input è una textarea
  this._isTextarea = function(field) {
    return (field.input.type == Inputs.TEXTAREA);
  };
  // verifica se è una select
  this._isSelect = function(field) {
    return (_.includes(Inputs.specialInputs,field.input.type) && field.input.type == Inputs.SELECT);
  };
  // verifica se è tipo radio button
  this._isRadio = function(field) {
    return (_.includes(Inputs.specialInputs, field.input.type) && field.input.type == Inputs.RADIO);
  };
  // verifica se è tipo checkbox
  this._isCheckbox = function(field) {
    return (_.includes(Inputs.specialInputs,field.input.type) && field.input.type == Inputs.CHECKBOX);
  };
  // verifica se il campo è un picklayer
  this._isLayerPicker = function(field) {
    return (_.includes(Inputs.specialInputs,field.input.type) && field.input.type == Inputs.LAYERPICKER);
  };
  // verifica se il campo è di tipo file
  this._isImage = function(field) {
    return (field.input.type == Inputs.IMAGE);
  };

  // FINE VERIFICA CAMPI

  //una volta cliccato sulla mappa dopo un picklayer ripulisce
  this._cleanUpPickLayer = function() {
    var mapService = GUI.getComponent('map').getService();
    mapService.removeInteraction(this._pickInteraction);
    this._pickInteraction = null;
    GUI.setModal(true);
  };
  this._pickLayerInputFieldChange = function(field, relation) {
    console.log('funzione che deve essere sovrascritta dal plugin');
  };
  // funzione chiata nel caso pick layer
  this._pickLayer = function(field, relation) {
    // ritorno una promessa, se qualcun altro volesse usare
    // il risultato (es. per settare altri campi in base alla feature selezionata)
    var d = $.Deferred();
    GUI.notify.info("Seleziona un'elemento dalla mappa per ottenere il valore di "+ field.label + " o scrivilo direttamentene");
    var self = this;
    // disabilito temporanemante lo strato modale per permettere l'interazione con la mappa
    GUI.setModal(false);
    var mapService = GUI.getComponent('map').getService();
    var layer = mapService.getProject().getLayerById(field.input.options.layerid);
    var relFieldName = field.input.options.field;
    var relFieldLabel = layer.getAttributeLabel(field.input.options.field);
    mapService.addInteraction(this.createPickInteraction());
    this._pickInteraction.on('picked',function(e){
      QueryService.queryByLocation(e.coordinate, [layer])
        .then(function(response){
          var featuresForLayers = response.data;
          if (featuresForLayers.length && featuresForLayers[0].features.length) {
            var attributes = featuresForLayers[0].features[0].getProperties(); // prendo la prima feature del primo (e unico) layer
            var value = attributes[relFieldName] ? attributes[relFieldName] : attributes[relFieldLabel];
            field.value = value;
            d.resolve(attributes);
          }
          else {
            d.reject();
          }
        })
        .fail(function(){
          d.reject();
        })
        .always(function() {
          self._cleanUpPickLayer();
        })
    });
    return d.promise();
  };
  //funzione che server per poter copiare lo state di una feature identificata
  // sul form attuale di un'altra feature
  this._pickLayerToClipBoard = function() {
    //TODO
    var self = this;
    // ritorno una promessa, se qualcun altro volesse
    // usare il risultato (es. per settare altri campi in base alla feature selezionata)
    var d = $.Deferred();
    if (this._pickedPromise) {
      return this._pickedPromise
    }
    // disabilito temporanemante lo strato modale per permettere l'interazione con la mappa
    GUI.setModal(false);
    // recupero mapservice perchè mi permette di ineteragire con la mappa
    var mapService = GUI.getComponent('map').getService();
    var vectorLayer = this.editor.getVectorLayer();
    var layer = mapService.getProject().getLayerById(vectorLayer.id);
    // l'aggiungo alla mappa
    mapService.addInteraction(this.createPickInteraction());
    // on picked
    this._pickInteraction.on('picked', function(e) {
      // qui passo lo stessso layer su cui sto agendo
      QueryService.queryByLocation(e.coordinate, [layer])
        .then(function(response) {
          var featuresForLayers = response.data;
          // verifico se ci sono features selezionate
          if (featuresForLayers.length && featuresForLayers[0].features.length) {
            // rpendo la prima feature
            var featureLayer = featuresForLayers[0].features[0];
            var pk = vectorLayer.getPk();
            var feature = vectorLayer.getFeatureById(featureLayer.get(pk));
            // prendo dal vectorLayer la feature basato sull'id della richiesta
            if (!feature) {
              feature = vectorLayer.getFeatureById(featureLayer.getId());
            }
            var fields = vectorLayer.getFieldsWithValues(feature);
            var relationsPromise = self.editor.getRelationsWithValues(feature);
            relationsPromise
              .then(function(relations) {
                self._pasteStateWithoutPk(fields, relations);
                d.resolve();
              });
          }
        })
        .fail(function() {
          d.reject();
        })
        .always(function() {
          self._cleanUpPickLayer();
        })
    });
    return d.promise();
  };
  // funzione che ritorna il valore di default del campo
  this._getDefaultValue = function(field) {
    if (field.input && field.input.options && field.input.options.default) {
      return field.input.options.default;
    } else if (this._isSelect(field)) {
      return field.input.options.values[0].key;
    }
    return '';
  };
  // restituisce il nome del layer che si è appena cliccato con il picklayer
  this._getlayerPickerLayerName = function(layerId){
    mapService = GUI.getComponent('map').getService();
    var layer = mapService.getProject().getLayerById(layerId);
    if (layer){
      return layer.getName();
    }
    return "";
  };
  // da cancellare?
  this._shouldShowRelation = function(relation) {
    return true;
  };

  // per definire i valori di default nel caso si tratta di un nuovo inserimento
  this._setupFields = function() {
    var self = this;
    var fields = _.filter(this.state.fields,function(field){
      // tutti i campi eccetto la PK (se non nulla)
      if (self.pk && field.value==null){
        return ((field.name != self.pk));
      }
      return true;
    });
    _.forEach(fields,function(field){
      if(_.isNil(field.value)){
        var defaultValue = self._getDefaultValue(field);
        if (defaultValue){
          field.value = defaultValue;
        }
      }
    });
  };
// funzione che setta i campi della relazione
  this._setupRelationsFields = function(relations) {
    var self = this;
    relations = relations || this.state.relations;
    if (relations) {
      _.forEach(relations, function(relation) {
        _.forEach(relation.elements, function(element) {
          self._setupRelationElementFields(element);
        })
      });
    }
  };

  this._setupRelationElementFields = function(element) {
    var self = this;
    _.forEach(element.fields,function(field){
      if(_.isNil(field.value)){
        field.value = self._getDefaultValue(field);
      }
    })
  };

  this._setupPanel = function(){
    var panel = this.internalComponent = new this._formPanel({
      form: this
    });
    if (this.options.buttons) {
      panel.buttons = this.options.buttons;
    }
    var elementsBoxes = this.getUniqueRelationsElementId();
    this.state.elementsBoxes = elementsBoxes;
    // qui associo lo state del pannello allo ste del form
    panel.state = this.state;
    this._setFormTools(this.tools);
    return panel;
  };

  this._setFormTools = function(tools) {
    var self = this;
    _.forEach(tools, function(tool) {
      self.state.tools[tool] = true;
    })
  };

  this.getUniqueRelationsElementId = function(bool) {
    var self = this;
    var elementsBoxes = {};
    var collapsed = _.isNil(bool) ? true : bool;
    _.forEach(this.state.relations, function(relation){
      _.forEach(relation.elements, function(element){
        var boxid = self.getUniqueRelationElementId(relation,element);
        elementsBoxes[boxid] = {
          collapsed: collapsed
        }
      })
    });
    return elementsBoxes;
  };

  this.getUniqueRelationElementId = function(relation, element){
    return relation.name+'_'+element.id;
  };

  this._getField = function(fieldName){
    var field = null;
    _.forEach(this.state.fields,function(f){
      if (f.name == fieldName){
        field = f;
      }
    });
    return field;
  };

  this._addRelationElement = function(relation) {
    // chama la funzione editor che crea una relazione
    var element = this.provider.createRelationElement(relation);
    var elementBoxId = this.getUniqueRelationElementId(relation, element);
    Vue.set(this.state.elementsBoxes, elementBoxId,{collapsed:false});
    this._setupRelationElementFields(element);
    relation.elements.push(element);
  };

  this._removeRelationElement = function(relation, element){
    var self = this;
    _.forEach(relation.elements,function(_element, idxToRemove){
      if (_element.id == element.id) {
        //relation.elements.splice(idxToRemove,1);
        element.state = element.state+'_DELETED'; // lo marco come elminato
        delete self.state.elementsBoxes.elmentBoxId;
      }
    })
  };

  this._removeRelationElements = function(relation) {
    var self = this;
    _.forEach(relation.elements, function(element){
      self._removeRelationElement(relation, element);
    })
  };

  this._getRelationField = function(fieldName, relationName){
    var field = null;
    _.forEach(this.state.relations,function(relation){
      if (relationName == relation.name){
        _.forEach(relation.fields,function(f){
          if (f.name == fieldName){
            field = f;
          }
        })
      }
    });
    return field;
  };

  this._getRelationElementField = function(fieldName, element) {
    var field;
    _.forEach(element.fields,function(_field){
      if (_field.name == fieldName) {
        field = _field;
      }
    });
    return field;
  };

  base(this);
}

// Make the public service en Event Emitter
inherit(FormService, G3WObject);

module.exports = FormService;