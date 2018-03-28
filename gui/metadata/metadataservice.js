const inherit = require('core/utils/utils').inherit;
const GUI = require('gui/gui');
const G3WObject = require('core/g3wobject');
const t = require('core/i18n/i18n.service').t;
const addI18n = require('core/i18n/i18n.service').addI18n;
const ProjectsRegistry = require('core/project/projectsregistry');
const ProjectMetadataComponent = require('./vue/components/project/project');

// object to add i18n traslations
const MetadataI18n = {
  'it': {
    'metadata': {
      "title": "Metadati",
      'groups': {
        'general': {
          'title': 'Generale',
          'fields': {
            'title': 'Titolo',
            'name': 'Nome',
            'description': "Descrizione",
            'abstract': "Abstract",
            'keywords': 'Parole chiave',
            "fees": "Tasse",
            "accessconstraints": "Limiti Accesso",
            'contactinformation': "Contatti",
            'wms_url': "WMS"
          }
        },
        'spatial':{
          'title': 'Info Spaziali',
          'fields' : {
            'crs': 'EPSG',
            'extent': 'BBOX'
          }
        },
        'layers': {
          'title': 'Strati',
          'fields': {
            'layers': 'Strati'
          }
        }
      }
    }
  },
  'en': {
    'metadata': {
      'title': 'Metadata',
      'groups': {
        'general': {
          'title': 'General',
          'fields': {
            'title': 'Title',
            'name': 'Name',
            'description': "Description",
            'abstract': "Abstract",
            'keywords': 'Keywords',
            "fees": "Fees",
            "accessconstraints": "Access Contraints",
            'contactinformation': "Contacts",
            'wms_url': "WMS"
          }
        },
        'spatial':{
          'title': 'Spatial',
          'fields' : {
            'crs': 'EPSG',
            'extent': 'BBOX'
          }
        },
        'layers': {
          'title': 'Layers',
          'fields': {
            'layers': 'Layers'
          }
        }
      }
    }
  }
};

function MetadataService() {
  this.content = null;
  this.show = false;
  this.state = {
    name: '',
    groups: {}
  };
  //add new traslation items to application
  addI18n(MetadataI18n);
  this._buildProjectGroupMetadata();
}

inherit(MetadataService, G3WObject);

const proto = MetadataService.prototype;

proto._buildProjectGroupMetadata = function() {
  const project = ProjectsRegistry.getCurrentProject().getState();
  this.state.name = project.title;
  // get one group (it for example)
  const projectGroups = MetadataI18n.it.metadata.groups;
  const groups = {};
  Object.entries(projectGroups).forEach(([groupName, value]) => {
    groups[groupName] = {};
    Object.keys(value.fields).forEach((field) => {
      const  fieldValue = project.metadata[field] ? project.metadata[field] : project[field];
      if (!!fieldValue) {
        groups[groupName][field] = {
          label: t(['metadata','groups', groupName, 'fields', field].join('.')), // get traslation here
          value: fieldValue
        }
      }
    })
  });
  this.state.groups = groups;
};


proto.getProjectMetadata = function() {
  return this.state;
};

proto.getLayersMetadata = function() {
  return this.state.groups.layers;
};

proto.getLayerMetadata = function(id) {
  const layerMetadata = this.state.groups.layers.filter((layer) => {
    return layer.id === id;
  });
  return layerMetadata[0];
};

proto.showMetadata = function(bool) {
  this.show = bool;
  if (this.show) {
    this.content = new ProjectMetadataComponent({
      state: this.getProjectMetadata(),
      service: this
    });
    GUI.setContent({
      content: this.content,
      title: t("metadata.title"),
      perc: 100
    });
    this.show = true;
  } else {
    GUI.closeContent()
  }
};

proto.reload = function() {
  this.emit('reload');
  this._buildProjectGroupMetadata();
};



module.exports = MetadataService;
