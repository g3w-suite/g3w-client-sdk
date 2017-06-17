var inherit = require('core/utils/utils').inherit;
var localize = require('core/i18n/i18n.service').t;
var resolve = require('core/utils/utils').resolve;
var GUI = require('gui/gui');
var QueryService = require('core/query/queryservice');
var ListPanel = require('gui/listpanel').ListPanel;
var Panel = require('gui/panel');
var ProjectsRegistry = require('core/project/projectsregistry');
var LayersStore = require('core/layers/layersstore');

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
      QueryService.queryByFilter([this.filterObject])
      .then(function(results) {
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
    this.queryLayer = LayersStore.getLayerById(queryLayerId);
    //vado a riempire gli input del form del pannello con campo e valore
    this.fillInputsFormFromFilter();
    //creo e assegno l'oggetto filtro
    var filterObjFromConfig = QueryService.createQueryFilterFromConfig(this.filter);
    //alla fine creo l'ggetto finale del filtro da passare poi al provider QGISWMS o WFS etc.. che contiene sia
    //il filtro che url, il nome del layer il tipo di server etc ..
    this.internalPanel.filterObject = QueryService.createQueryFilterObject({
      queryLayers: [this.queryLayer],
      filter: filterObjFromConfig
    });
    // da migliorare
    this.internalPanel.filterObject = this.internalPanel.filterObject[0];
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
}

inherit(SearchPanel, Panel);

module.exports = SearchPanel;
