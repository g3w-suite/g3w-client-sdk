var Control = require('./control');
var GUI = require('gui/gui');

var InteractionControl = function(options) {
  this._toggled = this._toggled || false;
  this._interactionClass = options.interactionClass || null;
  this._interaction = null;
  this._autountoggle = options.autountoggle || false;
  this._geometryTypes = options.geometryTypes || []; // array con tipologie di geometria layer
  this._onSelectLayer = options.onselectlayer || false;
  this._enabled = (options.enabled === false) ? false : true;
  this._onhover = options.onhover || false;
  this._help = options.help  || null;
  this._modalHelp = this._help ? (options.modalHelp || GUI.notify.info) : null;
  options.buttonClickHandler = InteractionControl.prototype._handleClick.bind(this);
  Control.call(this, options);
  // vado a creare il modal help se esiste un messaggio
  if (this._help) {
    this._createModalHelp();
  }
};

ol.inherits(InteractionControl, Control);

var proto = InteractionControl.prototype;

proto._clearModalHelp = function(id) {
  var self = this;
  $('body').delegate('#'+id,'click', function() {
    self._modalHelp = null;
  });
};

//funzione che si occupa di  visualizzazre la modeal dell'help
proto._showModalHelp = function() {
  if (this._modalHelp) {
    this._modalHelp(this._help);
  }
};

// funzione che crea la help modal
proto._createModalHelp = function() {
  var self = this;
  var id = "close_button"+Math.floor(Math.random()*1000000)+""+Date.now();
  this._help += '<button id="'+id+'" type="button" class="btn btn-default pull-right"> Non mostrare più </button>';
  // verifico se abilitato e se settato proprietà onhover
  if (this._onhover) {
    $(this.element).hover(function() {
      if (!self._enabled) {
        self._showModalHelp();
      }
    });
  }
  this._clearModalHelp(id);
};

proto.getGeometryTypes = function() {
  return this._geometryTypes;
};

// funzione per la gestione premuto non premuto
proto.toggle = function(toggle) {
  var toggle = toggle !== undefined ? toggle : !this._toggled;
  //stato del toogle;
  this._toggled = toggle;
  var controlButton = $(this.element).find('button').first();
  if (toggle) {
    this._showModalHelp();
    if (this._interaction) {
      this._interaction.setActive(true);
    }
    controlButton.addClass('g3w-ol-toggled');
  }
  else {
    if (this._interaction) {
      this._interaction.setActive(false);
    }
    controlButton.removeClass('g3w-ol-toggled');
  }
};

// funzione che abilita e disabilita il controllo
proto.setEnable = function(bool) {
  var controlButton = $(this.element).find('button').first();
  if (bool)  {
    controlButton.removeClass('g3w-ol-disabled');
  } else {
    controlButton.addClass('g3w-ol-disabled');
    controlButton.removeClass('g3w-ol-toggled');
    if (this._interaction) {
      this._interaction.setActive(false);
    }
  }
  this._enabled = bool;
};

proto.getEnable = function() {
  return this._enabled;
};

proto.getGeometryTypes = function() {
  return this._geometryTypes;
};

proto.setGeometryTypes = function(types) {
  this._geometryTypes = types;
};

proto.onSelectLayer = function() {
  return this._onSelectLayer;
};

proto.setMap = function(map) {
  if (!this._interaction && this._interactionClass) {
    this._interaction = new this._interactionClass;
    map.addInteraction(this._interaction);
    this._interaction.setActive(false);
  }
  Control.prototype.setMap.call(this,map);
};

proto._handleClick = function(e) {
  if (this._enabled) {
    this.toggle();
    Control.prototype._handleClick.call(this,e);
  }
};


module.exports = InteractionControl;
