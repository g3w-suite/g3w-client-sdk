var Control = require('./control');

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
  this._modalHelp = this._help ? (options.modalHelp || toastr) : null;
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
  $('body').delegate('#'+id,'change', function() {
    self._modalHelp = null;
  });
};

//funzione che si occupa di  visualizzazre la modeal dell'help
proto._showModalHelp = function() {
  var previousToastPositionClass = toastr.options.positionClass;
  // qui c'è una dipendenza con l'app template
  var contentDiv = $('#g3w-view-content');
  if (this._modalHelp) {
    toastr.options.positionClass = 'toast-top-right';
    // se già presente un modale lo chiudo
    this._modalHelp.clear();
    var helpElement = this._modalHelp.info(this._help);
    if (contentDiv) {
      var right = contentDiv.css('width');
      $(helpElement).css('right', right);
    }
    toastr.options.positionClass = previousToastPositionClass;
  }
};

// funzione che crea la help modal
proto._createModalHelp = function() {
  var self = this;
  var id = "close_button"+Math.floor(Math.random()*1000000)+""+Date.now();
  this._help += '<label for="'+id+'" style="float:right">Non mostrare più</label><input type="checkbox" id="'+id+'" class="pull-right"/>';
  // verifico se abilitato e se settato proprietà onhover
  if (this._onhover) {
    $(this.element).on('mouseenter', function() {
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

proto.getInteraction = function() {
  return this._interaction;
};

proto.isToggled = function() {
  return this._toggled;
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
