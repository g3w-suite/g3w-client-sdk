// questa classe mi serve per far applicare le modifche fatte sulle varie feature
// sui vari oggetti che ne devono essere modificati
function ChangesManager() {
  this.execute = function(object, items, reverse) {
    var fnc;
    _.forEach(items, function(item) {
      if (reverse) {
        // cambio lo stato dell'item al suo opposto
        item[ChangesManager.Actions[item.getState()].opposite]();
      }
      // estraggo il comnado / metogo da eseguire sull'oggetto
      fnc = ChangesManager.Actions[item.getState()].fnc;
      object[fnc](item);
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