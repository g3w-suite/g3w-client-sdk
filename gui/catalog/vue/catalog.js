var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var ComponentsRegistry = require('gui/componentsregistry');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');
var ControlsRegistry = require('gui/map/control/registry');
var Service = require('../catalogservice');

var CatalogEventHub = new Vue();

var vueComponentOptions = {
  template: require('./catalog.html'),
  data: function() {
    return {
      state: null
    }
  },
  computed: {
    project: function() {
      return this.state.prstate.currentProject
    },
    title: function() {
      return this.project.state.title;
    },
    layerstree: function() {
      return this.project.state.layerstree;
    },
    baselayers: function(){
      return this.project.state.baselayers;
    },
    hasBaseLayers: function(){
      return this.project.state.baselayers.length>0;
    }
  },
  methods: {
    setBaseLayer: function(id) {
      this.project.setBaseLayer(id);
    },
    onAddFile: function(evt) {
      var self = this;
      console.log(evt);
      var reader = new FileReader();
      var fileObj = {
        name: evt.target.files[0].name,
        visible: true,
        title: evt.target.files[0].name,
        custom: true,
        id: 'customLayer-' +  evt.target.files[0].name,
        visible: true
      };
      reader.onload = function(evt) {
        console.log('qui');
        self.$options.service.addCustomLayer(evt, fileObj);
      };
      reader.readAsText(evt.target.files[0]);
    }
  },
  mounted: function() {
    var self = this;
    CatalogEventHub.$on('treenodetoogled',function(node) {
      if (node.custom) {
        var mapService = GUI.getComponent('map').getService();
        mapService.getMap().getLayers().forEach(function(layer) {

         if (layer.get('name') == node.name) {
           layer.setVisible(!layer.getVisible());
           node.visible = !node.visible;
         }
        })
      } else {
        self.project.toggleLayer(node.id);
      }
    });

    CatalogEventHub.$on('treenodestoogled',function(nodes,parentChecked) {
      var layersIds = _.map(nodes,'id');
      self.project.toggleLayers(layersIds, parentChecked);
    });

    CatalogEventHub.$on('treenodeselected',function(node) {
      var mapservice = GUI.getComponent('map').getService();
      if (!node.selected) {
        self.project.selectLayer(node.id);
        // emetto il segnale layer selezionato dal catalogo
        mapservice.emit('cataloglayerselected');
      } else {
        self.project.unselectLayer(node.id);
        mapservice.emit('cataloglayerunselected');
      }
    });
    ControlsRegistry.onafter('registerControl', function(id, control) {
      if (id == 'querybbox') {
        control.getInteraction().on('propertychange', function(evt) {
          if (evt.key == 'active') {
            self.state.highlightlayers=!evt.oldValue;
          }
        })
      }
    });
    $('input:file').filestyle({
      buttonText: "",
      input: false,
      buttonName: "btn-primary",
      iconName: "glyphicon glyphicon-plus"
    })
  }
};

// se lo voglio istanziare manualmente
var InternalComponent = Vue.extend(vueComponentOptions);

// se lo voglio usare come componente come elemento html
Vue.component('g3w-catalog', vueComponentOptions);


/* COMPONENTI FIGLI */

// tree component


Vue.component('tristate-tree', {
  template: require('./tristate-tree.html'),
  props: {
    layerstree: {},
    //eredito il numero di childs dal parent
    checked: false,
    highlightlayers: false,
    parentFolder: false,
    customlayers: null
  },
  data: function () {
    return {
      expanded: this.layerstree.expanded,
      parentChecked: !this.checked,
      controltoggled: false,
      n_childs: null
    }
  },
  watch: {
    'checked': function(val) {
      this.layerstree.visible = val;
    }
  },
  computed: {
    isFolder: function () {
      // lo metto qui n_childs perchè nel caso del reload ltiene quello precedente;
      this.n_childs = this.layerstree.nodes ? this.layerstree.nodes.length : 0;
      var isFolder = this.n_childs ? true : false;
      if (isFolder) {
        var _visibleChilds = 0;
        _.forEach(this.layerstree.nodes, function(layer){
          if (layer.visible){
            _visibleChilds += 1;
          }
        });
        this.n_parentChilds = this.n_childs - _visibleChilds;
      }
      return isFolder
    },
    isHidden: function() {
      return this.layerstree.hidden && (this.layerstree.hidden === true);
    },
    selected: function() {
      var isSelected = this.layerstree.selected ? "SI" : "NO";
      return isSelected;
    },
    isHighLight: function() {
      var project = ProjectsRegistry.getCurrentProject();
      return this.highlightlayers && project.state.crs == this.layerstree.crs &&  this.layerstree.wfscapabilities == 1 ;
    }

  },
  methods: {
    toggle: function (checkAllLayers) {
      var checkAll = checkAllLayers == 'true' ? true : false;
      if (this.isFolder && !checkAll) {
        this.layerstree.expanded = !this.layerstree.expanded;
      }
      else if (checkAll) {
        if (this.parentChecked && !this.n_parentChilds){
          this.parentChecked = false;
        } else if (this.parentChecked && this.n_parentChilds) {
          this.parentChecked = true;
        }
        else {
          this.parentChecked = !this.parentChecked;
        }
        CatalogEventHub.$emit('treenodestoogled',this.layerstree.nodes, this.parentChecked);
      }
      else {
        CatalogEventHub.$emit('treenodetoogled',this.layerstree);
      }
    },
    select: function (layerstree) {
      if (!this.isFolder && !layerstree.custom) {
        CatalogEventHub.$emit('treenodeselected',this.layerstree);
      }
    },
    triClass: function () {
      if (!this.n_parentChilds) {
        return 'fa-check-square-o';
      } else if ((this.n_parentChilds > 0) && (this.n_parentChilds < this.n_childs)) {
        return 'fa-square';
      } else {
        return 'fa-square-o';
      }
    },
    deleteLayer: function(name) {
      var self = this;
      var mapService = GUI.getComponent('map').getService();
      var map = mapService.getMap();
      map.getLayers().forEach(function(layer) {
        if(layer.get('name') == name) {
          map.removeLayer(layer);
        }
      });
      _.forEach(this.customlayers, function(layer, index){
         if (layer.name == name) {
           self.customlayers.splice(index, 1);
         }
      })
    }
  }
})

Vue.component('layerslegend',{
    template: require('./legend.html'),
    props: ['layerstree'],
    data: function() {
      return {
        //data qui
      }
    },
    computed: {
      visiblelayers: function(){
        var _visiblelayers = [];
        var layerstree = this.layerstree;
        function traverse(obj){
        _.forIn(obj, function (layer, key) {
              //verifica che il valore dell'id non sia nullo
              if (!_.isNil(layer.id) && layer.visible) {
                  _visiblelayers.push(layer);
              }
              if (!_.isNil(layer.nodes)) {
                  traverse(layer.nodes);
              }
          });
        }
        traverse(layerstree);
        return _visiblelayers;
      }
    },
    watch: {
      'layerstree': {
        handler: function(val, old){
          //codice qui
        },
        deep: true
      }
    },
    mounted: function() {
      Vue.nextTick(function() {
        $('.legend-item').perfectScrollbar();
      });
    }
});

Vue.component('layerslegend-item',{
  template: require('./legend_item.html'),
  props: ['layer'],
  computed: {
    legendurl: function(){
      // in attesa di risolvere lo schianto di QGSI Server...
      //return "http://localhost/cgi-bin/qgis_mapserv.fcgi?map=/home/giohappy/Scrivania/Dev/G3W/g3w-client/test/progetto/test.qgs&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYERTITLE=False&ITEMFONTSIZE=10&LAYER="+this.layer.name;
      var projectLyer = ProjectsRegistry.getCurrentProject().getLayerById(this.layer.id);
      if (projectLyer) {
        return projectLyer.getLegendUrl();
      }
    }
  },
  methods: {
    // esempio utilizzo del servizio GUI
    openform: function(){
      //GUI.notify.success("Apro un form");
      //GUI.showForm();
    },
    updateLegendScroll: function(evt) {
      $(evt.target).perfectScrollbar('update');
    }
  }
});

/* FINE COMPONENTI FIGLI */

/* INTERFACCIA PUBBLICA */
function CatalogComponent(options) {
  base(this);
  var self = this;
  this.id = "catalog-component";
  this.title = "catalog";
  this.mapComponentId = options.mapcomponentid;
  var service = options.service || new Service;
  this.setService(service);
  this.setInternalComponent(new InternalComponent({
    service: service
  }));
  this.internalComponent.state = this.getService().state;
  function listenToMapVisibility(map) {
    var mapService = map.getService();
    self.state.visible = !mapService.state.hidden;
    mapService.onafter('setHidden',function(hidden) {
      self.state.visible = !mapService.state.hidden;
      self.state.expanded = true;
    })
  }
  if (this.mapComponentId) {
    var map = GUI.getComponent(this.mapComponentId);
    if (!map) {
      ComponentsRegistry.on('componentregistered',function(component){
        if (component.getId() == self.mapComponentId) {
          listenToMapVisibility(component);
        }
      })
    }
    else {
      listenToMapVisibility(map)
    }
  }
  //mergio opzioni con proprità di default del componente
  merge(this, options);
}

inherit(CatalogComponent, Component);

module.exports = CatalogComponent;
