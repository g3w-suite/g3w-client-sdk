var inherit = require('core/utils/utils').inherit;
var merge = require('core/utils/utils').merge;
var base = require('core/utils/utils').base;
var G3WObject = require('core/g3wobject');
var VUECOMPONENTSATTRIBUTES = ['methods', 'computed', 'data', 'components'];

var Component = function(options) {

  options = options || {};
  this.internalComponent = null;
  this.id = options.id || Math.random() * 1000;
  this.title = options.title || '';
  this.state = {
    visible: options.visible || true,
    open: options.open || false
  };
  //setters
  this.setters = {
    setOpen: function(bool) {
      this.state.open = bool;
      this._setOpen();
    },
    setVisible: function(bool) {
      this.state.visible = bool;
      this._setVisible();
    }
  };
  base(this);
};

inherit(Component, G3WObject);

var proto = Component.prototype;

// restituisce id del componente
proto.getId = function() {
  return this.id;
};

// setta id del component
proto.setId = function(id) {
  this.id = id;
};

// restituice il titolo del componente
proto.getTitle = function() {
  return this.state.title;
};

//setta il titolo del componente
proto.setTitle = function(title) {
  this.state.title = title;
};

//implementati due metodi per poter unificare il metodo di recupero del servizio
//legato al componente
// resituisce il service del componente
proto.getService = function() {
  return this._service;
};

// setta il service del componente
proto.setService = function(service) {
  this._service = service;
};

// restituisce il componente vue interno
proto.getInternalComponent = function() {
  return this.internalComponent;
};

// setta il nuovo internalcomponent
proto.setInternalComponent = function(internalComponent) {
  if (!internalComponent && this.internalComponentClass) {
    this.internalComponent = new this.internalComponentClass;
  }
  else {
    // internal component è un'istanza e non una classe
    this.internalComponent = internalComponent;
  }
};

proto.createVueComponent = function (vueObjOptions) {
  return _.cloneDeep(vueObjOptions);
};

// aggiunge dati all'internalComponent
proto.addInternalComponentData = function(data) {
  _.merge(this.internalComponent, data)
};

// sovrascrive il metodo del service originale con uno nuovo
proto.overwriteServiceMethod = function(methodName, method) {
  this._service[methodName] = method;
};

// sovrascrive i metodi che hanno chiave uguale a quelli presenti nel servizio
proto.overwriteServiceMethods = function(methodsOptions) {
  var self = this;
  _.forEach(methodsOptions, function(method, methodName) {
    self.overwriteServiceMethod(methodName, method);
  })
};

// estendo il servizio con nuovi metodi
proto.extendService = function(serviceOptions) {
  if (this._service) {
    merge(this._service, serviceOptions);
  }
};

// estende in modo generico il vue component
proto.extendInternalComponent = function(internalComponentOptions) {
  var self = this;
  if (this.vueComponent) {
    // faccio il clone altrimenti ho problem con i components
    _.forEach(internalComponentOptions, function(value, key) {
      if (VUECOMPONENTSATTRIBUTES.indexOf(key) > -1) {
        switch (key) {
          case 'methods':
            self.extendInternalComponentMethods(value);
            break;
          case 'components':
            self.extendInternalComponentComponents(value);
            break;
          default:
            merge(self.vueComponent[key], value);
        }
      }
    });
  } else {
    this.vueComponent = internalComponentOptions;
  }
};

//funzione che estende l'attributo components dell'oggetto vue Component
proto.extendInternalComponentComponents = function(components) {
  if (components) {
    merge(this.vueComponent.components, components);
  }
};

// estende i methods il vue component
proto.extendInternalComponentMethods = function(methods) {
  if (methods) {
    // ciclo sulle chiavi dell'oggetto per verificare che sia una funzione
    _.forEach(methods, function (value, key) {
      if (!(value instanceof Function)){
        delete methods[key];
      }
    });
    merge(this.vueComponent.methods, methods);
  }
};

// estende i computed del vue component
proto.extendInternalComponentComputed = function(computed) {
  if (computed) {
    // ciclo sulle chiavi dell'oggetto per verificare che sia una funzione
    _.forEach(computed, function (value, key) {
      if (!(value instanceof Function)){
        delete computed[key];
      }
    });
    merge(this.vueComponent.computed, computed);
  }
};

//setto il template del componente vue
proto.setInternalComponentTemplate = function(template) {
  // dovrò poi aggiungere regole per verificare se il
  // tenplate è compatibile ad un template o no
  if (template) {
    this.vueComponent.template = template;
  }
};

proto.getInternalTemplate = function() {
  return this.vueComponent.template;
};

////////// fine metodi Service Components //////////
/* HOOKS */
/* 
 * Il metodo permette al componente di montarsi nel DOM
 * parentEl: elemento DOM padre, su cui inserirsi; 
 * ritorna una promise, risolta nel momento in cui sarà terminato il montaggio
*/
proto.mount = function(parent) {};

/*
 * Metodo richiamato quando si vuole rimuovere il componente.
 * Ritorna una promessa che sarà risolta nel momento in cui il componente avrà completato la propria rimozione (ed eventuale rilascio di risorse dipendenti)
*/
proto.unmount = function() {};

proto.ismount = function() {
  return true;
};

// se si vuole usare il componete lo deve ridefinire
proto._setOpen = function() {
};


// se si vuole usare il componete lo deve ridefinire
proto._setVisible = function() {};

/* 
 * Metodo (opzionale) che offre l'opportunità di ricalcolare proprietà dipendenti dalle dimensioni del padre
 * parentHeight: nuova altezza del parent
 * parentWidth: nuova larghezza del parent
 * richiamato ogni volta che il parent subisce un ridimensionamento
*/
proto.layout = function(parentWidth, parentHeight) {};


module.exports = Component;
