var inherit = require('core/utils/utils').inherit;
var GUI = require('gui/gui');
var Panel = require('gui/panel');
var ProjectsRegistry = require('core/project/projectsregistry');
var Filter = require('core/layers/filter/filter');
var Expression = require('core/layers/filter/expression');

//componente vue pannello search
var SearchPanelComponet = Vue.extend({
  template: require('./searchpanel.html'),
  data: function() {
    return {
      title: "",
      forminputs: [],
      filterObject: {},
      formInputValues : [],
      queryurl: null
    }
  },
  methods: {
    doSearch: function(event) {
      var self = this;
      event.preventDefault();
      //al momento molto farragginoso ma da rivedere
      //per associazione valore input
      this.filterObject = this.fillFilterInputsWithValues(this.filterObject, this.formInputValues);
      // forzo il cambiamento dell'url se esiste il query url
      if (this.queryurl) {
        this.filterObject.url = this.queryurl;
      }
      var showQueryResults = GUI.showContentFactory('query');
      var queryResultsPanel = showQueryResults(self.title);
      var filter = new Filter();
      var expression = new Expression();
      expression.createExpressionFromFilter(this.filterObject.filter, this.queryLayer.getName());
      filter.setExpression(expression.get());
      this.queryLayer.search({
        filter: filter
      })
      .then(function(results) {
        results = {
          data: results
        };
         queryResultsPanel.setQueryResponse(results);
      })
      .fail(function() {
        GUI.notify.error('Si è verificato un errore nella richiesta al server');
        GUI.closeContent();
      })
    }
  }
});

//costruttore del pannello e del suo componente vue
function SearchPanel(options) {
  self = this;
  var options = options || {};
  this.config = {};
  this.filter = {};
  this.id = null;
  this.querylayerid = null;
  this.internalPanel = options.internalPanel || new SearchPanelComponet();
  //funzione inizializzazione
  this.init = function(config) {
    this.config = config || {};
    this.name = this.config.name || this.name;
    this.id = this.config.id || this.id;
    // rpendo il filtro restituito dal server
    this.filter = this.config.options.filter || this.filter;
    this.internalPanel.queryurl = this.config.options.queryurl || null;
    var queryLayerId = this.config.options.querylayerid || this.querylayerid;
    // recupero il query layer dall'id della configurazione
    this.queryLayer = ProjectsRegistry.getCurrentProject().getLayersStore().getLayerById(queryLayerId);
    //vado a riempire gli input del form del pannello con campo e valore
    this.fillInputsFormFromFilter();
    //creo e assegno l'oggetto filtro
    var filterObjFromConfig = this.createQueryFilterFromConfig(this.filter);

    //alla fine creo l'ggetto finale del filtro da passare poi al provider QGISWMS o WFS etc.. che contiene sia
    //il filtro che url, il nome del layer il tipo di server etc ..
    this.internalPanel.filterObject = this.createQueryFilterObject({
      queryLayer: this.queryLayer,
      filter: filterObjFromConfig
    });
    this.internalPanel.filterObject = this.internalPanel.filterObject;
    this.internalPanel.queryLayer = this.queryLayer;
    //soluzione momentanea assegno  la funzione del SearchPanle ma come pattern è sbagliato
    //vorrei delegarlo a SearchesService ma lo stesso stanzia questo (loop) come uscirne???
    //creare un searchpanelservice?
    this.internalPanel.fillFilterInputsWithValues = this.fillFilterInputsWithValues;
    this.internalPanel.title = this.name;
  };
  //funzione che popola gli inputs che ci saranno nel form del pannello ricerca
  //oltre costruire un oggetto che legherà i valori degli inputs del form con gli oggetti
  //'operazionali' del filtro
  this.fillInputsFormFromFilter = function() {
    var id = 0;
    var formValue;
    _.forEach(this.filter,function(v,k,obj) {
      _.forEach(v, function(input){
        //sempre nuovo oggetto
        formValue = {};
        //inserisco l'id all'input
        input.id = id;
        //aggiungo il tipo al valore per fare conversione da stringa a tipo input
        formValue.type = input.input.type;
        ////TEMPORANEO !!! DEVO PRENDERE IL VERO VALORE DI DEFAULT
        formValue.value = null;
        //popolo gli inputs:
        // valori
        self.internalPanel.formInputValues.push(formValue);
        //input
        self.internalPanel.forminputs.push(input);
        id+=1;
      });
    });
  };
  //funzione che associa i valori dell'inputs form al relativo oggetto "operazionde del filtro"
  this.fillFilterInputsWithValues = function(filterObject, formInputValues, globalIndex) {
    //funzione conversione da valore restituito dall'input (sempre stringa) al vero tipo di valore
    function convertInputValueToInputType(type, value) {
      switch(type) {
        case 'numberfield':
             value = parseInt(value);
             break;
        default:
             break;
      }
      return value;
    }
    //ciclo sull'oggetto filtro che ha come chiave root 'AND' o 'OR'
    _.forEach(filterObject.filter, function(v,k) {
      //scorro attraverso l'array di elementi operazionali da confrontare
      _.forEach(v, function(input, idx) {
        //elemento operazionale {'=':{}}
        _.forEach(input, function(v, k, obj) {
          //vado a leggere l'oggetto attributo
          if (_.isArray(v)) {
            //richiama la funzione ricorsivamente .. andrà bene ?
            fillFilterInputsWithValues(input, formInputValues, idx);
          } else {
            _.forEach(v, function(v, k, obj) {
              //considero l'index globale in modo che inputs di operazioni booleane interne
              //vengono considerate
              index = (globalIndex) ? globalIndex + idx : idx;
              obj[k] = convertInputValueToInputType(formInputValues[index].type, formInputValues[index].value);
            });
          }
        });
      });
    });
    return filterObject;
  };

  this.createQueryFilterFromConfig = function(filter) {
    var queryFilter = {};
    var operator;
    var field;
    var booleanObject = {};
    //funzione che costruisce l'oggetto operatore es. {'=':{'nomecampo':null}}
    function createOperatorObject(obj) {
      //rinizializzo a oggetto vuoto
      evalObject = {};
      //verifico che l'oggetto passato non sia a sua volta un oggetto 'BOOLEANO'
      _.forEach(obj, function(v,k) {
        if (_.isArray(v)) {
          return createBooleanObject(k,v);
        }
      });
      field = obj.attribute;
      operator = obj.op;
      evalObject[operator] = {};
      evalObject[operator][field] = null;
      return evalObject;
    }
    //functione che costruisce oggetti BOOLEANI caso AND OR contenente array di oggetti fornit dalla funzione createOperatorObject
    function createBooleanObject(booleanOperator, operations) {
      booleanObject = {};
      booleanObject[booleanOperator] = [];
      _.forEach(operations, function(operation){
        booleanObject[booleanOperator].push(createOperatorObject(operation));
      });
      return booleanObject;
    }
    /*
     // vado a creare l'oggetto filtro principale. Questo è un oggetto che contiene l'operatore booleano come root (chiave)
     // come valore un array di oggetti operatori che contengono il tipo di operatore come chiave e come valore un oggetto contenete
     // nome campo e valore passato
     */
    _.forEach(filter, function(v,k,obj) {
      queryFilter = createBooleanObject(k,v);
    });
    return queryFilter;
  };

// funzione che in base ai layer coinvolti nella chaita del filtro,
// creerà un'array di oggetti a seconda del tipo di layer
  this.createQueryFilterObject = function(options) {
    var options = options || {};
    var queryLayer = options.queryLayer || [];
    var ogcService = options.ogcService || 'wms';
    var filter =  options.filter || {};
    var queryFilter;
    var info = this.getInfoFromLayer(queryLayer, ogcService);
    // vado a creare un oggetto/array di oggetti con informazioni rigurdanti layers in comune
    queryFilter = _.merge(info, {
      // Servizio ogc: wfs, wms etc..
      ogcService: ogcService,
      filter : filter // oggetto che descrive come dovrà essere composto il filtro dal provider
    });
    return queryFilter
  };

// restituisce gli url per ogni layer o gruppo di layers
// che condividono lo stesso indirizzo di servizio
  this.getInfoFromLayer = function(layer, ogcService) {
    // wfs specifica se deve essere fatta chiamata wfs o no
    var urlForLayer = {};
    // scooro sui ogni layer e catturo il queryUrl
    // se wfs prendo l'api fornite dal server
    if (ogcService == 'wfs') {
      var queryUrl = layer.getProject().getWmsUrl();
    } else {
      var queryUrl = layer.getQueryUrl();
    }
    urlsForLayer = {
      url: queryUrl,
      layers: [],
      infoFormat: layer.getInfoFormat(ogcService),
      crs: layer.getCrs(), // dovrebbe essere comune a tutti
      serverType: layer.getServerType() // aggiungo anche il tipo di server
    };
    return urlForLayer;
  };
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
