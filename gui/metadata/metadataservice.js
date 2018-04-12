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
          'title': 'GENERALE',
          'fields': {
            'title': 'TITOLO',
            'name': 'NOME',
            'description': "DESCRIZIONE",
            'abstract': "ABSTRACT",
            'keywords': 'PAROLE CHIAVE',
            "fees": "TASSE",
            "accessconstraints": "LIMITI DI ACCESSO",
            'contactinformation': "CONTATTI",
            'subfields': {
              'contactinformation': {
                'contactelectronicmailaddress': "Email",
                'personprimary': 'Riferimenti',
                'contactvoicetelephone': 'Telefono',
                'contactorganization': 'Organizzazione',
                'contactposition': 'Posizione',
                'contactperson': 'Persona'
              }
            },
            'wms_url': "WMS"
          }
        },
        'spatial':{
          'title': 'INFO SPAZIALI',
          'fields' : {
            'crs': 'EPSG',
            'extent': 'BBOX'
          }
        },
        'layers': {
          'title': 'STRATI',
          'groups' : {
            'general': 'GENERALE',
            'spatial': 'INFO SPAZIALI'
          },
          'fields': {
            'layers': 'STRATI',
            'subfields': {
              'crs': 'EPSG',
              'bbox': 'BBOX',
              'title': "TITOLO",
              'name': 'NOME',
              'geometrytype': 'GEOMETRIA',
              'source': 'SORGENTE',
              'attributes': 'ATTRIBUTI',
              'abstract': 'ABSTRACT',
              'attribution': 'ATTRIBUTION',
              'keywords': "PAROLE CHIAVE",
              'metadataurl':'METADATA URL',
              'dataurl': "DATA URL"
            }
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
          'title': 'GENERAL',
          'fields': {
            'title': 'TITLE',
            'name': 'NAME',
            'description': "DESCRIPTION",
            'abstract': "ABASTRACT",
            'keywords': 'KEYWORDS',
            "fees": "FEES",
            "accessconstraints": "ACCESS CONSTRAINT",
            'contactinformation': "CONTACTS",
            'subfields': {
              'contactinformation': {
                'contactelectronicmailaddress': "Email",
                'personprimary': 'Refereces',
                'contactvoicetelephone': 'Phone',
                'contactorganization': 'Organization',
                'contactposition': 'Position',
                'contactperson': 'Person'
              }
            },
            'wms_url': "WMS"
          }
        },
        'spatial':{
          'title': 'SPATIAL',
          'fields' : {
            'crs': 'EPSG',
            'extent': 'BBOX'
          }
        },
        'layers': {
          'title': 'LAYERS',
          'fields': {
            'layers': 'LAYERS',
            'subfields': {
              'crs': 'EPSG',
              'bbox': 'BBOX',
              'title': "TITLE",
              'name': 'NAME',
              'geometrytype': 'GEOMETRY',
              'source': 'SOURCE',
              'attributes': 'ATTRIBUTES',
              'abstract': 'ABSTRACT',
              'attribution': 'ATTRIBUTION',
              'keywords': "PAROLE CHIAVE",
              'metadataurl':'METADATA URL',
              'dataurl': "DATA URL"

            }
          },
          'groups' : {
            'general': 'GENERAL',
            'spatial': 'SPATIAL'
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
      const  fieldValue = project.metadata && project.metadata[field] ? project.metadata[field] : project[field];
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
