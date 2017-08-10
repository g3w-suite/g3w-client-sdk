// questa classe mi serve per far applicare le modifche fatte sulle varie feature
// sui vari oggetti che ne devono essere modificati
function ChangesManager() {
  this.execute = function(object, items, reverse) {
    var fnc;
    var feature;
    _.forEach(items, function(item) {
      feature = item.feature;
      if (reverse) {
        // cambio lo stato dell'item al suo opposto
        feature[ChangesManager.Actions[feature.getState()].opposite]();
      }
      // estraggo il comnado / metogo da eseguire sull'oggetto
      fnc = ChangesManager.Actions[feature.getState()].fnc;
      object[fnc](feature);
    })
  }
}

// azioni possibili
ChangesManager.Actions = {
  'add': {
    fnc: 'addFeature',
    opposite: 'delete'
  },
  'delete': {
    fnc: 'removeFeature',
    opposite: 'add'
  },
  'update': {
    fnc: 'updateFeature',
    opposite: 'update'
  }
};

module.exports = new ChangesManager();