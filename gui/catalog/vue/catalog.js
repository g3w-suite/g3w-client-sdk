var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var Component = require('gui/vue/component');
var ComponentsRegistry = require('gui/componentsregistry');
var GUI = require('gui/gui');
var ProjectsStore = require('core/project/projectsstore');
var ControlsRegistry = require('gui/map/control/registry');
var LayersStore = require('core/layers/layersstore');
var Service = require('../catalogservice');
var ChromeComponent = VueColor.Chrome;
var CatalogEventHub = new Vue();

var vueComponentOptions = {
  template: require('./catalog.html'),
  data: function() {
    return {
      state: null,
      //oggetto per la visualizzazione del contextmenu
      // tasto destro
      layerMenu: {
        show: false,
        top:0,
        left:0,
        name: '',
        layer: null,
        //oggetto colorMenu
        colorMenu: {
          show: false,
          top:0,
          left: 0,
          color: null
        }
      }

    }
  },
  directives: {
    //creo la direttiva per il click fuori dal contextmenu
    'click-outside-layer-menu': {
      bind: function (el, binding, vnode) {
        this.event = function (event) {
          if(!(el == event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event);
          }
        };
        //aggiungo event listener click
        document.body.addEventListener('click', this.event)
      },
      unbind: function (el) {
        document.body.removeEventListener('click', this.event)
      }
    }
  },
  components: {
    'chrome-picker': ChromeComponent
  },
  computed: {
    project: function() {
      return this.state.prstate.currentProject
    },
    title: function() {
      return this.project.state.title;
    },
    layerstree: function() {
      var project = ProjectsStore.getCurrentProject();
      return project.state.layerstree;
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
    zoomToLayer: function() {
      var bbox;
      if (this.layerMenu.layer.bbox) {
        bbox = [this.layerMenu.layer.bbox.minx, this.layerMenu.layer.bbox.miny, this.layerMenu.layer.bbox.maxx, this.layerMenu.layer.bbox.maxy] ;
      }
      var mapService = GUI.getComponent('map').getService();
      mapService.goToBBox(bbox);
      this.layerMenu.show = false;
    },
    closeLayerMenu: function() {
      this.layerMenu.show = false;
      this.showColorMenu(false);
    },
    onChangeColor: function(val) {
      var mapService = GUI.getComponent('map').getService();
      this.layerMenu.colorMenu.color = val;
      var layer = mapService.getLayerByName(this.layerMenu.name);
      layer.setStyle(mapService.setExternalLayerColor(val));
    },
    showColorMenu: function(bool, evt) {
      if(bool) {
        var elem = $(evt.target);
        this.layerMenu.colorMenu.top = elem.offset().top;
        this.layerMenu.colorMenu.left = elem.offset().left + elem.width() + ((elem.outerWidth() - elem.width()) /2);
      }
      this.layerMenu.colorMenu.show = bool;
    }
  },
  mounted: function() {
    var self = this;
    CatalogEventHub.$on('treenodetoogled',function(node) {
      if (node.external) {
        var mapService = GUI.getComponent('map').getService();
        var layer;
        layer = mapService.getLayerByName(node.name);
        layer.setVisible(!layer.getVisible());
        node.visible = !node.visible;
      } else {
        LayersStore.toggleLayer(node.id);
      }
    });

    CatalogEventHub.$on('treenodestoogled',function(nodes,parentChecked) {
      var layersIds = [];
      function checkNodes(obj) {
        if (obj.nodes) {
          _.forEach(obj.nodes, function(node) {
            checkNodes(node);
          });
        } else {
          layersIds.push(obj.id);
        }
      }
      _.map(nodes,checkNodes);
      LayersStore.toggleLayers(layersIds, parentChecked);
    });

    CatalogEventHub.$on('treenodeselected',function(node) {
      var mapservice = GUI.getComponent('map').getService();
      var layer = LayersStore.getLayerById(node.id);
      if (!layer.isSelected()) {
        LayersStore.selectLayer(node.id);
        // emetto il segnale layer selezionato dal catalogo
        mapservice.emit('cataloglayerselected');
      } else {
        LayersStore.unselectLayer(node.id);
        mapservice.emit('cataloglayerunselected');
      }
    });

    CatalogEventHub.$on('showmenulayer', function(layerstree, evt) {
      self.layerMenu.top = evt.y;
      self.layerMenu.left = evt.x;
      self.layerMenu.name = layerstree.name;
      self.layerMenu.layer = layerstree;
      self.layerMenu.show = true;
      self.layerMenu.colorMenu.color = layerstree.color;
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
    });
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
    externallayers: null
  },
  data: function () {
    return {
      expanded: this.layerstree.expanded,
      parentChecked: !this.checked,
      controltoggled: false,
      n_childs: null,
      layer: null // aggiiunto il layer perchè voglio lavorare con i layer e non con i layerstree
    }
  },
  watch: {
    'checked': function(val) {
      this.layerstree.visible = val;
    }
  },
  computed: {
    isFolder: function () {
      var _visibleChilds = 0;
      var _childsLength = 0;
      (function countLayersVisible(layerstree) {
        _.forEach(layerstree.nodes, function(layer) {
          if (!layer.nodes) _childsLength+=1;
          if (layer.visible) {
            _visibleChilds += 1;
          } else if (layer.nodes) {
            countLayersVisible(layer);
          }
        });
      })(this.layerstree);
      // lo metto qui n_childs perchè nel caso del reload ltiene quello precedente
      this.n_childs = _childsLength;//this.layerstree.nodes ? this.layerstree.nodes.length : 0;
      var isFolder = this.n_childs ? true : false;
      if (isFolder) {
        this.n_parentChilds = this.n_childs - _visibleChilds;
      } else {
        this.layer = LayersStore.getLayerById(this.layerstree.id);
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
      var project = ProjectsStore.getCurrentProject();
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
    select: function (layer) {
      if (!this.isFolder && !this.layerstree.external) {
        CatalogEventHub.$emit('treenodeselected', this.layerstree);
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
    removeExternalLayer: function(name) {
      var mapService = GUI.getComponent('map').getService();
      var layer = mapService.getLayerByName(name);
      mapService.removeExternalLayer(name);
    },
    showLayerMenu: function(layerstree, evt) {
      if (!this.isFolder) {
        CatalogEventHub.$emit('showmenulayer',layerstree, evt);
      }
    }
  }
});

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
      var project = ProjectsStore.getCurrentProject();
      if (project) {
        return project.getLegendUrl(this.layer);
      }
    }
  },
  methods: {
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
