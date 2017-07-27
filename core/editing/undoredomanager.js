var FeaturesStore = require('core/layers/features/featuresstore');

var ReverseCommands = {
  'FeaturesStore': {
    'add': {
      method: 'removeFeature',
      reverse: 'delete'
    },
    'delete': {
      method: 'addFeature',
      reverse: 'add'
    },
    'update': {
      method: 'updateFeature',
      reverse: 'update'
    }
  },
  'olVector': {
    'add': {
      method: 'removeFeature',
      reverse: 'delete'
    },
    'delete': {
      method: 'addFeature',
      reverse: 'add'
    },
    'update': {
      method: 'updateFeature',
      reverse: 'update'
    }
  }
};

function UndoRedoManager() {
  this.execute = function(object, items) {
    var commands;
    var command;
    if (object instanceof FeaturesStore) {
      commands = ReverseCommands['FeaturesStore'];
    } else if (object instanceof ol.layer.Vector) {
      object = object.getSource();
      commands = ReverseCommands['olVector'];
    }
    _.forEach(items, function(item) {
      command = commands[item.getState()].method;
      item[commands[item.getState()].reverse]();
      object[command](item);
    })
  }
}

module.exports = new UndoRedoManager();