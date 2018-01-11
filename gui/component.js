const inherit = require('core/utils/utils').inherit;
const merge = require('core/utils/utils').merge;
const base = require('core/utils/utils').base;
const G3WObject = require('core/g3wobject');
const t = require('core/i18n/i18n.service').t;
const VUECOMPONENTSATTRIBUTES = ['methods', 'computed', 'data', 'components'];

// Classe componente base
const Component = function(options) {
  options = options || {};
  // compontente interno vue
  this.internalComponent = null;
  // componenti che faranno parte del template
  this._components = [];
  this.id = options.id || Math.random() * 1000;
  // titolo
  this.title = options.title || '';
  // stato del componente
  this.state = {
    visible: options.visible || true, // visibile
    open: options.open || false // open
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
    },
    reload: function() {
      this._reload();
    }
  };
  // funzione che automatizza l'inizializzazione del componente
  // altimenti ognuno deve ridefinire tutto il flusso ogni volta
  this.init = function(options) {
    options = options || {};
    // lo devo fare per problemi con compoents
    this.vueComponent = this.createVueComponent(options.vueComponentObject);
    this._components = options.components || [];
    // vado a settasre il service
    this.setService(options.service);
    // inizializzo il servizio
    this._service.init ? this._service.init(options): null;
    // setto il template interno
    this.setInternalComponentTemplate(options.template);
    // funzione che permette di settare il componente interno
    this.setInternalComponent = function() {
      const InternalComponent = Vue.extend(this.vueComponent);
      this.internalComponent = new InternalComponent({
        service: this._service,
        template: this.getInternalTemplate()
      });
      // associo lo state del componente interno a quello del service
      // perchè le funzioni che maipolano lo stato del componente sono delegate al service nella
      // maggior parte dei casi
      this.internalComponent.state = this.getService().state;
      this.internalComponent.state.components = this._components;
    };
    this.setInternalComponent();
  };
  base(this);
};

inherit(Component, G3WObject);

const proto = Component.prototype;

// restituisce id del componente
proto.getId = function() {
  return this.id;
};

// setta id del component
proto.setId = function(id) {
  this.id = id;
};

proto.getOpen = function() {
  return this.state.open;
};

proto.getVisible = function() {
  return this.state.visible;
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

proto.insertComponentAt = function(index, Component) {
  this._components.splice(index, 0, Component);
};

proto.removeCompomentAt = function(index) {
  this._components.splice(index, 1);
};

proto.addComponent = function(Component) {
  this._components.push(Component);
};

proto.popComponent = function() {
  return this._components.pop();
};


proto.removeComponent = function(Component) {
  this._components.forEach((component, index) => {
    if (component == Component) {
      this.splice(index, 1);
      return false;
    }
  })
};

proto.setComponents = function(components) {
  this._components = _.isArray(components) ? components: [];
};

proto.exendComponents = function(components) {
  _.merge(this._components, components);
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

// fa un clone deep di un oggetto atto ad essere utilizzato
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
  Object.entries(methodsOptions).forEach(([methodName, method]) => {
    this.overwriteServiceMethod(methodName, method);
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
  if (this.vueComponent) {
    // faccio il clone altrimenti ho problem con i components
    Object.entries(internalComponentOptions).forEach(([key, value]) => {
      // verifico che ci sia uno chiame appartenete agli attributi previsti dal compoennte vue
      if (VUECOMPONENTSATTRIBUTES.indexOf(key) > -1) {
        switch (key) {
          case 'methods':
            this.extendInternalComponentMethods(value);
            break;
          case 'components':
            this.extendInternalComponentComponents(value);
            break;
          default:
            merge(this.vueComponent[key], value);
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

// funzione che fa quello che fa sopra ma chiamata in modo più appropriato
proto.extendComponents = function(components) {
  this.extendInternalComponentComponents(components);
};

//funzione che estende l'attributo components dell'oggetto vue Component
proto.addComponent = function(component) {
  if (component) {
    this.vueComponent.components[component.key] = component.value;
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

// resituisce il template
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
// è un hook per eventuali chiamate post pre open
proto._setOpen = function() {
};


// se si vuole usare il componete lo deve ridefinire
proto._setVisible = function() {};


//funzione che dovrà essere sovrascritta dai singoli componenti
proto._reload = function() {
};

/*
 * Metodo (opzionale) che offre l'opportunità di ricalcolare proprietà dipendenti dalle dimensioni del padre
 * parentHeight: nuova altezza del parent
 * parentWidth: nuova larghezza del parent
 * richiamato ogni volta che il parent subisce un ridimensionamento
*/
proto.layout = function(parentWidth, parentHeight) {};


module.exports = Component;
