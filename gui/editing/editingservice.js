var t = require('core/i18n/i18n.service').t;
var inherit = require('core/utils/utils').inherit;
var G3WObject = require('core/g3wobject');
var GUI = require('gui/gui');
var VectorLoaderLayer = require('core/map/layer/loader/vectorloaderlayer');
var FormClass = require('gui/form/vue/form');

function EditingService(options) {
  var options = options || {};
  var self = this;
  //qui vado  a settare il mapservice
  this._mapService = options.mapService || GUI.getComponent('map').getService();
  //definisco i codici layer
  this._layerCodes = options.layerCodes || {};
  // classi editor
  this._editorClass = options.editorClass || {};
  //definisco layer del plugin come oggetto
  this._layers = options.layers || {};
  //definisco il loader del plugin
  this._loader = options.loader || new VectorLoaderLayer;
  var editingConstraints = {
    resolution: 1 // vincolo di risoluzione massima
  };
  this._formClass = options.formClass || FormClass;
  //messaggi per gli steps del tool
  this._toolStepsMessages = options.toolStepsMessages || {};
  this._loadDataOnMapViewChangeListener = null;
  this._currentEditingLayer = null;
  this.state = {
    editing: {
      on: false,
      enabled: false,
      layerCode: null,
      toolType: null,
      startingEditingTool: false,
      toolstep: {
        n: null,
        total: null,
        message: null
      }
    },
    retrievingData: false,
    hasEdits: false
  };
  this.init = function(config) {
    var self = this;
    this.config = config;
    //inizializzo il loader
    // passandogli:
    // 1 - layers del plugin (style etc..)
    // 2 - la baseurl che mi server per interagire con il server per fare tutte le modifiche
    var options_loader = {
      'layers': this._layers,
      'baseurl': this.config.baseurl,
      'mapService': this._mapService
    };
    //inizializzo il loader
    this._loader.init(options_loader);
    //caso di loading data
    this._loader.on('loadingvectorlayersstart', function() {
      self.state.retrievingData = true;
    });
    this._loader.on('loadingvectorlayersend', function() {
      self.state.retrievingData = false;
    });
    // disabilito l'eventuale tool attivo se viene attivata
    // un'interazione di tipo pointerInteractionSet sulla mappa
    this._mapService.on('pointerInteractionSet', function(interaction) {
      var currentEditingLayer = self._getCurrentEditingLayer();
      if (currentEditingLayer) {
        var activeTool = currentEditingLayer.editor.getActiveTool().instance;
        // devo verificare che non sia un'interazione attivata da uno dei tool di editing del plugin
        if (activeTool && !activeTool.ownsInteraction(interaction)) {
          self._stopEditingTool();
        }
      }
    });
    //  abilito o meno l'editing in base alla risoluzione della mappa
    this._mapService.onafter('setMapView',function(bbox, resolution){
      self.state.editing.enabled = (resolution < editingConstraints.resolution) ? true : false;
    });
    // attributo dello stato del srevizio che mi permette di accendere o spengere l'editing
    // serve anche per poter in fase di toggleEditing(bottone di avvio editing) di vedere se posso inziare o meno
    // caricare i vettoriali etc..
    this.state.editing.enabled = (this._mapService.getResolution() < editingConstraints.resolution) ? true : false;
    // per ogni layer definiti nel plugin setto name e id
    // recuperati grazie al mapservice
    _.forEach(this._layers, function(Layer, layerCode) {
      //recupero l'id dalla configurazione del plugin
      // i layers nella configurazione passata i layers hanno due attributi: id e name
      var layerId = config.layers[layerCode].id;
      // recupera il layer dal mapservice
      var layer = self._mapService.getProject().getLayerById(layerId);
      // recupero l'origin name dal projectlayer
      Layer.name = layer.getOrigName();
      Layer.id = layerId;
    });
  };
  // fine del metodo INIT
  // metodi GETTERS and SETTERS
  //LOADER
  this.setLoader = function(loader) {
    this._loader = loader;
  };

  //get loader service
  this.getLoader = function() {
    return this._loader;
  };

  //LAYERS
  this.setLayers = function(layers) {
    this._layers = layers;
  };

  this.getLayers = function(layers) {
    return this._layers;
  };

  // layer By layerCode
  this.getLayer = function(layerCode) {
    return this._layers[layerCode];
  };

  // LAYERS CODE
  this.setLayersCode = function(layerCodes) {
    this._layerCodes = layerCodes;
  };

  this.getLayerCodes = function() {
    return this._layerCodes;
  };

  // FORM CLASS
  this.setFormClass = function(formClass) {
    this._formClass = formClass;
  };

  this.getFormClass = function() {
    return this._formClass;
  };
  // FINE METODI GETTERS SETTERS

  //stop
  this.stop = function() {
    var deferred = $.Deferred();
    if (this.state.editing.on) {
      this._cancelOrSave()
      .then(function() {
        self._stopEditing();
        deferred.resolve();
      })
      .fail(function(){
        deferred.reject();
      })
      .always(function() {
        GUI.closeForm();
      })
    } else {
      deferred.resolve();
    }
    return deferred.promise();
  };

  // avvio o termino la sessione di editing generale
  // unto di partenza dell'avvio dell'editing
  this.toggleEditing = function() {
    // creo oggetto deferred per restituire una promise
    var deferred = $.Deferred();
    // qui dice che se nel caso la risoluzione della mappa va bene (state.editing.enabled)
    // e non è ancora stato attivato l'editing
    // quindi caso prima volta
    if (this.state.editing.enabled && !this.state.editing.on) {
      // faccio partire editing
      this._startEditing();
    }
    // altrimenti se è già in editing chiamo lo stop del plugin
    // che non è altro che lo stop dell'editing
    else if (this.state.editing.on) {
      return this.stop();
    }
    // restituisco una promessa
    return deferred.promise();
  };

  this.saveEdits = function(){
    this._cancelOrSave(2);
  };

  // avvia uno dei tool di editing tra quelli supportati da Editor (addfeature, ecc.)
  // funzione dell'elemento panel vue
  this.toggleEditTool = function(layerCode, toolType) {
    var self = this;
    //prendo il layer in base al codice passato dall componente vue
    var layer = this._layers[layerCode];
    if (layer) {
      //recuprero il current layer in editing
      var currentEditingLayer = this._getCurrentEditingLayer();
      // se si sta usando un tool che prevede lo stesso layer in editazione
      if (currentEditingLayer && layerCode == currentEditingLayer.layerCode) {
        // e lo stesso tool allora disattivo il tool (in quanto è
        // premuto sullo stesso bottone)
        if (toolType == currentEditingLayer.editor.getActiveTool().getType()) {
          // stesso tipo di tool quindi si è verificato un toggle nel bottone
          // allora stippo l'editing Tool
          this._stopEditingTool();
        }
        // altrimenti attivo il tool richiesto
        else {
          //stoppo preventivamente l'editing tool attivo
          this._stopEditingTool();
          //faccio partire l'editng tool passando current Editing Layer e il tipo di tool
          this._startEditingTool(currentEditingLayer, toolType);
        }
      } else {
        // altrimenti caso in cui non è stato settato il current editing layer o
        // il layer che si sta cercando di editare è diverso da quello in editing in precedenza
        // nel caso sia già  attivo un editor verifico di poterlo stoppare
        if (currentEditingLayer && currentEditingLayer.editor.isStarted()) {
          // se la terminazione dell'editing sarà  andata a buon fine, setto il tool
          // provo a stoppare
          this._cancelOrSave(2)
          .then(function(){
            if (self._stopEditor()) {
              self._startEditingTool(layer, toolType);
            }
          })
        } else {
          //nel caso sia la prima volta che interagisco con un tool
          // e quindi non è stato settato nessun layer in editing
          this._startEditingTool(layer, toolType);
        }
      }
    }
  };

  /* METODI PRIVATI */
  // funzione per settare il vectorlayer alla prorietà vector del layer
  this._setUpVectorLayer = function(layerCode, vectorLayer) {
    this._layers[layerCode].vector = vectorLayer;
  };

  //funzione che permette di fare il setup dell'editor e asseganrlo al layer
  this._setUpEditor = function(layerCode) {
    var self = this;
    //option editor
    var options_editor = {
      'mapService': self._mapService,
      'formClass': this._formClass
    };
    // prendo il vector layer del layer
    var vectorLayer = this._layers[layerCode].vector;
    //GESTIONE E INIZIALIZZAZIONE DELL'EDITOR RELATIVO AL LAYER VETTORIALE
    //creo l'istanza dell'editor che gestirà il layer
    var editor = new self._editorClass[layerCode](options_editor);
    //setto il layer vettoriale associato all'editor
    // e i tipi di tools associati ad esso
    editor.setVectorLayer(vectorLayer);
    //emette evento che è stata generata una modifica la layer
    editor.on("dirty", function (dirty) {
      self.state.hasEdits = dirty;
    });
    //assegno l'istanza editor al layer tramite la proprietà editor
    this._layers[layerCode].editor = editor;
    //// FINE GESTIONE EDITOR
  };

  //fa partire l'editing
  this._startEditing = function() {
    // mi assicuro che se per qualsisi motivo
    // faccio uno starediting di un editing già avviato
    // ritorno perchè ho già tutto (lo faccio per sicurennza non si sa mai)
    if (this.state.editing.on || this.state.retrievingData) {
      return;
    }
    var self = this;
    // chiedo al loader di caricare i dati
    this._loader.loadLayers('w') // carico i layer in modalità editing (scrittura)
    .then(function(vectorLayersLoaded) {
      //una volta che il loader ha finito di caricare i layer vettoriali
      //questo mi restituisce i codice dei layer che sono stati caricati(array)
      _.forEach(vectorLayersLoaded, function(layerCode) {
        // per ogni layer faccio il setup dell'editor
        self._setUpEditor(layerCode);
      });
      // se tutto  è andato a buon fine aggiungo i VectorLayer alla mappa
      self._addToMap();
      self.state.editing.on = true;
      self.emit("editingstarted");
      if (!self._loadDataOnMapViewChangeListener) {
        //viene ritornata la listener key
        self._loadDataOnMapViewChangeListener = self._mapService.onafter('setMapView', function() {
          if (self.state.editing.on && self.state.editing.enabled) {
            self._loader.loadAllVectorsData();
          }
        });
      }
    })
    .fail(function(){
      GUI.notify.error(t('could_not_load_vector_layers'));
    })
  };

  this._stopEditing = function(reset){
    // se posso stoppare tutti gli editor...
    if (this._stopEditor(reset)){
      _.forEach(this._layers, function(layer, layerCode){
        var vector = layer.vector;
        self._mapService.viewer.removeLayerByName(vector.name);
        layer.vector = null;
        layer.editor.destroy();
        layer.editor = null;
        self._unlockLayer(self._layers[layerCode]);
      });
      this._updateEditingState();
      self.state.editing.on = false;
      self._cleanUp();
      self.emit("editingstopped");
    }
  };

  this._cleanUp = function() {
    //vado ad annulare l'estenzione del loader per poter ricaricare i dati vetttoriali
    //da rivedere;
    this._loader.cleanUpLayers();
  };

  //se non è ancora partito faccio partire lo start editor
  this._startEditor = function(layer) {
    // avvio l'editor
    // passandoli il service che lo accetta
    if (layer.editor.start(this)) {
      // registro il current layer in editing
      this._setCurrentEditingLayer(layer);
      return true;
    }
    return false;
  };

  //funzione che viene chiamata al click su un tool dell'editing e se
  //non è stato assegnato ancora nessun layer come current layer editing
  this._startEditingTool = function(layer, toolType, options) {
    //assegno true allo startEditingTool attributo delllo state
    this.state.startingEditingTool = true;
    var canStartTool = true;
    //verifico se l'editor è partito o meno
    if (!layer.editor.isStarted()) {
      //se non è ancora partito lo faccio partire e ne prendo il risultato
      // true o false
      canStartTool = this._startEditor(layer);
    }
    // verifica se il tool può essere attivato
    // l'editor verifica se il tool richiesto è compatibile
    // con i tools previsti dall'editor. Crea istanza di tool e avvia il tool
    // attraverso il metodo run
    if (canStartTool && layer.editor.setTool(toolType, options)) {
      this._updateEditingState();
      this.state.startingEditingTool = false;
      return true;
    }
    this.state.startingEditingTool = false;
    return false;
  };

  // funzione che lancia lo stop sull'editor corrente
  this._stopEditor = function(reset) {
    var ret = true;
    var layer = this._getCurrentEditingLayer();
    if (layer) {
      ret = layer.editor.stop(reset);
      if (ret){
        this._setCurrentEditingLayer();
      }
    }
    return ret;
  };

  // funzione che si occupa di interromepere l'edting tool
  this._stopEditingTool = function() {
    var ret = true;
    // recupere il layer in current editing
    var layer = this._getCurrentEditingLayer();
    // se esiste ed era stato settato
    if (layer) {
      // se andato bene ritorna true
      ret = layer.editor.stopTool();
      if (ret) {
        this._updateEditingState();
      }
    }
    return ret;
  };

  // funzione che accetta come parametro il tipo di
  // operazione da fare a seconda dicosa è avvenuto
  this._cancelOrSave = function(type){
    var deferred = $.Deferred();
    // per sicurezza tengo tutto dentro un grosso try/catch,
    // per non rischiare di provocare inconsistenze nei dati durante il salvataggio
    try {
      var _askType = 1;
      if (type) {
        _askType = type
      }
      var self = this;
      var dirtyEditors = {};
      // verifico per ogni layer se l'edito associato è Dirty
      _.forEach(this._layers, function(layer, layerCode) {
        if (layer.editor.isDirty()) {
          dirtyEditors[layerCode] = layer.editor;
        }
      });
      // verifico se ci sono o meno editor sporchi
      if(_.keys(dirtyEditors).length) {
        this._askCancelOrSave(_askType)
        .then(function(action) {// ritorna il tipo di azione da fare
          // save, cancel, nosave
          if (action === 'save') {
            // passo gli editor spochi alla funzione _saveEdits
            self._saveEdits(dirtyEditors)
            .then(function(result){
               deferred.resolve();
             }).fail(function(result){
               deferred.reject();
             })
          } else if (action == 'nosave') {
            deferred.resolve();
          } else if (action == 'cancel') {
            deferred.reject();
          }
        })
      } else {
        deferred.resolve();
      }
    }
    catch (e) {
      deferred.reject();
    }
    return deferred.promise();
  };

    // funzione che in base al tipo di askType
    // visualizza il modale a cui rispondere, salva etc ..
  this._askCancelOrSave = function(type){
    var deferred = $.Deferred();
    var buttonTypes = {
      SAVE: {
        label: "Salva",
        className: "btn-success",
        callback: function(){
          deferred.resolve('save');
        }
      },
      NOSAVE: {
        label: "Termina senza salvare",
        className: "btn-danger",
        callback: function(){
          deferred.resolve('nosave');
        }
      },
      CANCEL: {
        label: "Annulla",
        className: "btn-primary",
        callback: function(){
          deferred.resolve('cancel');
        }
      }
    };
    switch (type){
      case 1:
        buttons = {
          save: buttonTypes.SAVE,
          nosave: buttonTypes.NOSAVE,
          cancel: buttonTypes.CANCEL
        };
        break;
      case 2:
        buttons = {
          save: buttonTypes.SAVE,
          cancel: buttonTypes.CANCEL
        };
        break;
    }
    GUI.dialog.dialog({
      message: "Vuoi salvare definitivamente le modifiche?",
      title: "Salvataggio modifica",
      buttons: buttons
    });
    return deferred.promise();
  };

  // funzione che salva i dati relativi al layer vettoriale
  // del dirtyEditor
  this._saveEdits = function(dirtyEditors) {
    var error_message;
    var deferred = $.Deferred();
    function traverseErrorMessage(obj) {
      _.forIn(obj, function (val, key) {
        if (_.isArray(val)) {
          error_message = val[0];
        }
        if (_.isObject(val)) {
          traverseErrorMessage(obj[key]);
        }
        if (error_message) {
          return false;
        }
      });
    }
    this._sendEdits(dirtyEditors)
    .then(function(response) {
      GUI.notify.success("I dati sono stati salvati correttamente");
      self._commitEdits(dirtyEditors, response);
      //funzione che fa il referesh dei wms layer così da essere allineati con
      // il layer vettoriale
      self._mapService.refreshMap();
      deferred.resolve();
    })
    .fail(function(errorResponse) {
      if (errorResponse) {
        traverseErrorMessage(errorResponse.error.data);
        GUI.notify.error("<h4>Errore nel salvataggio sul server</h4>" +
          "<h5>" + error_message + "</h5>");
      } else {
        GUI.notify.error("Errore nel salvataggio sul server");
      }
      deferred.resolve();
    });
    return deferred.promise();
  };

  // funzione che prende come ingresso gli editor sporchi
  this._sendEdits = function(dirtyEditors) {
    var deferred = $.Deferred();
    var editsToPush = _.map(dirtyEditors, function(editor) {
      return {
        layername: editor.getVectorLayer().name,
        edits: editor.getEditedFeatures()
      }
    });

      // esegue il post dei dati
    this._postData(editsToPush)
    .then(function(returned) {
      if (returned.result){
        deferred.resolve(returned.response);
      } else {
        deferred.reject(returned.response);
      }
    })
    .fail(function(returned){
      deferred.reject(returned.response);
    });
    return deferred.promise();
  };

  this._commitEdits = function(editors, response) {
    // un dubbio gli editors possono essere uno alla volta
    var layer;
    _.forEach(editors, function(editor) {
      if (response && response.new.length > 0) {
        // scorro array dei nuovi feature/relations
        _.forEach(response.new, function(updatedFeatureAttributes) {
          var oldfid = updatedFeatureAttributes.clientid;
          var fid = updatedFeatureAttributes.id;
          // verfico se oldfid è diverso da fid (in questo caso si ha a che fare con una nuova feature)
          if (oldfid != fid) {
            layer = editor.getEditVectorLayer();
          } else {
            // vecchia feature e quindi devo aggiornare le proprietà e relazioni senza cambiare l'id
            layer = editor.getVectorLayer()
          }
          // funzione che setta e va a cambiare l'id e gli attributi ma lo scopo principale
          // l'id della feature new (nuova)
          layer.setFeatureData(oldfid,fid,null,updatedFeatureAttributes);
          editor.commit(updatedFeatureAttributes)
        });
        _.forEach(response.new_lockids, function(newlockId) {
          editor.getVectorLayer().addLockId(newlockId);
        });
      } else {
        // nel caso di nessuna new (update e delete)
        editor.commit();
      }
    });
  };

  this._undoEdits = function(dirtyEditors){
    var currentEditingLayerCode = this._getCurrentEditingLayer().layerCode;
    var editor = dirtyEditors[currentEditingLayerCode];
    this._stopEditing(true);
  };

    // esegue l'update dello state nel caso ad esempio di un toggle del bottone tool
  this._updateEditingState = function() {
    // prende il layer in Editing
    var layer = this._getCurrentEditingLayer();
    if (layer) {
      this.state.editing.layerCode = layer.layerCode;
      this.state.editing.toolType = layer.editor.getActiveTool().getType();
    } else {
      this.state.editing.layerCode = null;
      this.state.editing.toolType = null;
    }
    this._updateToolStepsState();
  };

  this._updateToolStepsState = function() {
    var self = this;
    var layer = this._getCurrentEditingLayer();
    var activeTool;
    if (layer) {
      activeTool = layer.editor.getActiveTool();
    }
    if (activeTool && activeTool.getTool()) {
      var toolInstance = activeTool.getTool();
      if (toolInstance.steps){
        this._setToolStepState(activeTool);
        toolInstance.steps.on('step', function(index,step) {
          self._setToolStepState(activeTool);
        });
        toolInstance.steps.on('complete', function(){
          self._setToolStepState();
        })
      }
    } else {
      self._setToolStepState();
    }
  };

  this._setToolStepState = function(activeTool){
    var index, total, message;
    if (_.isUndefined(activeTool)){
      index = null;
      total = null;
      message = null;
    } else {
      var tool = activeTool.getTool();
      var messages = this._toolStepsMessages[activeTool.getType()];
      index = tool.steps.currentStepIndex();
      total = tool.steps.totalSteps();
      message = messages[index];
      if (_.isUndefined(message)) {
        index = null;
        total = null;
        message = null;
      }
    }
    this.state.editing.toolstep.n = index + 1;
    this.state.editing.toolstep.total = total;
    this.state.editing.toolstep.message = message;
  };

  this._getCurrentEditingLayer = function() {
    return this._currentEditingLayer;
  };

  this._setCurrentEditingLayer = function(layer){
    if (!layer){
      this._currentEditingLayer = null;
    } else {
      this._currentEditingLayer = layer;
    }
  };

  this._addToMap = function() {
    //recupero l'elemento map ol3
    var map = this._mapService.viewer.map;
    var layerCodes = this.getLayerCodes();
    //ogni layer lo aggiungo alla mappa
    //con il metodo addToMap di vectorLayer
    _.forEach(layerCodes, function(layerCode) {
      self._layers[layerCode].vector.addToMap(map);
    })
  };

  this._postData = function(editsToPush) {
    // mando un oggetto come nel caso del batch,
    // ma in questo caso devo prendere solo il primo, e unico, elemento
    if (editsToPush.length > 1) {
      return this._postBatchData(editsToPush);
    }
    var layerName = editsToPush[0].layername;
    var edits = editsToPush[0].edits;
    var jsonData = JSON.stringify(edits);
    return $.post({
      url: this.config.baseurl+layerName+"/",
      data: jsonData,
      contentType: "application/json"
    });
  };

  this._postBatchData = function(multiEditsToPush){
    var edits = {};
    _.forEach(multiEditsToPush,function(editsToPush){
      edits[editsToPush.layername] = editsToPush.edits;
    });
    var jsonData = JSON.stringify(edits);
    return $.post({
      url: this.config.baseurl,
      data: jsonData,
      contentType: "application/json"
    });
  };

  this._unlock = function(){
    var layerCodes = this.getLayerCodes();
    // eseguo le richieste delle configurazioni e mi tengo le promesse
    var unlockRequests = _.map(layerCodes,function(layerCode){
      return self._unlockLayer(self._layers[layerCode]);
    });
  };

  this._unlockLayer = function(layerConfig){
    $.get(this.config.baseurl+layerConfig.name+"/?unlock");
  };
}

inherit(EditingService, G3WObject);

module.exports = EditingService;
