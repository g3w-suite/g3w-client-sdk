var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var ProjectsRegistry = require('core/project/projectsregistry');

var Inputs = {};
Inputs.STRING = 'string';
Inputs.INTEGER = 'integer';
Inputs.FLOAT = 'float';
Inputs.BOOLEAN = 'boolean';
Inputs.RANGE = 'range';
Inputs.CHECK = 'check';
Inputs.DATAPICKER = 'datetimepicker';
Inputs.UNIQUE = 'unique';

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

function BodyFormService(options) {
  options = options || {};
  this.state = options.state;
  // funzione che supporta la validazione dei campi obbigatori al fine di abilitare o meno il Salva
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
  //funzione che mi server per estrarre il layer name dall'id del form
  this._checkIfFieldIsOverwritable = function(fieldName, fieldsdArray) {
    var check = null;
    _.forEach(fieldsdArray, function(field) {
      if (!_.isNil(field[fieldName])) {
        check = field[fieldName]
      }
    });
    return check;
  };
  // VERIFICA CAMPI
  // funzione che restituisce true/false a seconda se il campo è visibile o no
  this._isVisible = function(field) {
    return !(!field.editable && (field.value == "" || _.isNull(field.value)));
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

  // verifica se è l'input è di tipo range
  this._isRange = function() {
    return (field.input.type == Inputs.RANGE);
  };

  // verifica se è l'input è di tipo unique
  this._isUnique = function() {
    return (field.input.type == Inputs.UNIQUE);
  };

  // verifica se è l'input è di tipo datapicker
  this._isDataPicker = function() {
    return (field.input.type == Inputs.DATAPICKER);
  };

  // verifica se è l'input è di tipo check
  this._isCheck = function() {
    return (field.input.type == Inputs.CHECK);
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
  // funzione che verifa se il campo è obbligatorio o no
  this._hasFieldsRequired = function() {
    var someFieldsRequired = _.some(this.state.fields, function(field) {
      return field.validate && field.validate.required;
    });
    return someFieldsRequired;
  };

  // FINE VERIFICA CAMPI
  // funzione che ritorna il valore di default del campo
  this._getDefaultValue = function(field) {
    if (field.input && field.input.options && field.input.options.default) {
      return field.input.options.default;
    } else if (this._isSelect(field)) {
      return field.input.options.values[0].key;
    }
    return '';
  };
  // per definire i valori di default nel caso si tratta di un nuovo inserimento
  this.setupFields = function() {
    var self = this;
    var fields = _.filter(this.state.fields,function(field){
      // tutti i campi eccetto la PK (se non nulla)
      if (self.pk && field.value==null && !field.editable ){
        return ((field.name != self.pk));
      }
      return true;
    });
    _.forEach(fields,function(field){
      if(_.isNil(field.value)){
        var defaultValue = self._getDefaultValue(field);
        if (defaultValue) {
          field.value = defaultValue;
        }
      }
    });
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
  
  base(this);
}

// Make the public service en Event Emitter
inherit(BodyFormService, G3WObject);

module.exports = BodyFormService;