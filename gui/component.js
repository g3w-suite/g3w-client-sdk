var inherit = require('core/utils/utils').inherit;
var merge = require('core/utils/utils').merge;
var G3WObject = require('core/g3wobject');
var VUECOMPONENTSATTRIBUTES = ['methods', 'computed', 'data'];

var Component = function(options) {
  var options = options || {};
  this.internalComponent = null;
  this.id = options.id || Math.random() * 1000;
  this.title = options.title || '';
  this.state = {
    visible: options.visible || true,
    open: options.open || false
  }
};

inherit(Component, G3WObject);

var proto = Component.prototype;

proto.getInternalComponent = function() {
  return this.internalComponent;
};

proto.setInternalComponent = function(internalComponent) {
  this.internalComponent = internalComponent;
};
proto.overwriteServiceMethod = function(methodName, method) {
  this._service[methodName] = method;
};

proto.overwriteServiceMethods = function(methodsOptions) {
  var self = this;
  _.forEach(methodsOptions, function(method, methodName) {
    self.overwriteServiceMethod(methodName, method);
  })
};

// estendo il servizio
proto.extendService = function(serviceOptions) {
  if (this._service) {
    merge(this._service, serviceOptions);
  }
};
// estende in modo generico il vue component
proto.extendInternalComponent = function(internalComponentOptions) {
  var self = this;
  if (this.vueComponent) {
    _.forEach(internalComponentOptions, function(value, key) {
      switch(key) {
        case 'methods':
          self.extendInternalComponentMethods(value);
          break;
        default:
          merge(self.vueComponent[key], value);
      }
    });
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
proto.extendInternalComponentMethods = function(computed) {
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

// proto extend attribute of vue component (es. methods computed)

proto.extendInternalComponentAttribute = function(attribute, options) {
  if (options && (VUECOMPONENTSATTRIBUTES.indexOf(attribute) > - 1)) {
    // ciclo sulle chiavi dell'oggetto per verificare che sia una funzione
    _.forEach(options, function (value, key) {
      if (!(value instanceof Function)){
        delete options[key];
      }
    });
    merge(this.vueComponent[attribute], options);
  }
};

proto.setInternalComponentTemplate = function(template) {
  // dovrò poi aggiungere regole per verificare se il
  // tenplate è compatibile ad un template o no
  if (template) {
    this.vueComponent.template = template;
  }
};


proto.getId = function() {
  return this.id;
};

proto.getTitle = function() {
  return this.state.title;
};

proto.setTitle = function(title) {
  this.state.title = title;
};

//implementati due metodi per poter unificare il metodo di recupero del servizio
//legato al componente

proto.getService = function() {
  return this._service;
};

proto.setService = function(serviceInstance) {
  this._service = serviceInstance;
};

////////// fine metodi Service Components //////////
/* HOOKS */
/* 
 * Il metodo permette al componente di montarsi nel DOM
 * parentEl: elemento DOM padre, su cui inserirsi; 
 * ritorna una promise, risolta nel momento in cui sarà terminato il montaggio
*/
proto.mount = function(parent){};

/*
 * Metodo richiamato quando si vuole rimuovere il componente.
 * Ritorna una promessa che sarà risolta nel momento in cui il componente avrà completato la propria rimozione (ed eventuale rilascio di risorse dipendenti)
*/
proto.unmount = function(){};

proto.ismount = function(){
  return true;
};

/* 
 * Metodo (opzionale) che offre l'opportunità di ricalcolare proprietà dipendenti dalle dimensioni del padre
 * parentHeight: nuova altezza del parent
 * parentWidth: nuova larghezza del parent
 * richiamato ogni volta che il parent subisce un ridimensionamento
*/
proto.layout = function(parentWidth,parentHeight){};


module.exports = Component;
