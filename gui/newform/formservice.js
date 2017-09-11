var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');

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

function FormService() {
  this.state = null;
  this.setters = {
    setInitForm: function(options) {
      this._setInitForm(options);
    },
    // setter sul cambio dei campi
    setFormFields: function (fields) {
      this.state.fields = fields;
    },
    setupFields: function() {
      this._setupFields();
    },
    // setter sull'inserimento dei dati del form
    setFormData: function(fields) {
      this.setFormFields(fields);
    },
    // setter del singolo field
    setField: function(field) {},
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
    options = options || {};
    this.title = options.title || 'Form';
    this.formId = options.formId;
    this.name = options.name; // nome del form
    this.pk = options.pk || null; // eventuale chiave primaria (non tutti i form potrebbero avercela o averne bisogno
    this.buttons = options.buttons || []; // qui dovrò mettere i bottoni standar del form
    this._pickedPromise = null;
    // setto lo stato che lo divido per compoennti del form totale
    this.state = {
      title: this.title,
      fields: null,
      buttons: this.buttons,
      valid: true, // la validazione generale del form inzialmente è a true
        // verrà cambiata con un and generale a true false per ogni modfica dei campi singoli
      tovalidate: [] // contiene array di oggetti che deveono essere validati. Sono oggetti che contengono almeno il campo valid
    };
    //chiamo i setter
    this.setFormFields(options.fields);
  };
  // funzione che mi restituisco lo stato generale del form
  // ogni singolo input, al cambiamento del suo valore, comunicherà se è valido o no
  // e quiesto andrà ad inficiare lo stato generale del form
  this.isValid = function() {
    var bool = true;
    _.forEach(this.state.tovalidate, function(tovalidate) {
      console.log(tovalidate);
      if (!tovalidate.valid) {
        bool = false;
        return false;
      }
    });
    this.state.valid = bool;
  };
  this.addToValidate = function(validate) {
    console.log(validate);
    this.state.tovalidate.push(validate);
  };


  this.getState = function () {
    return this.state;
  };
  this._setState = function(state) {
    this.state = state;
  };
  this.addStateProperty = function(key, value) {
    this.state[key] = value;
  };
  //funzione che retituisce i fields
  this.getFields = function() {
    return this.state.fields;
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

  // funzione di inzializzazione
  this.init = function(options) {
    this._setInitForm(options);
  };


  base(this);
}

// Make the public service en Event Emitter
inherit(FormService, G3WObject);

module.exports = FormService;