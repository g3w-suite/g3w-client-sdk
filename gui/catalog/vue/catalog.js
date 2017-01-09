var inherit = require('core/utils/utils').inherit;
var base = require('core/utils/utils').base;
var merge = require('core/utils/utils').merge;
var t = require('core/i18n/i18n.service').t;
var resolve = require('core/utils/utils').resolve;
var Component = require('gui/vue/component');
var ComponentsRegistry = require('gui/componentsregistry');
var GUI = require('gui/gui');
var ProjectsRegistry = require('core/project/projectsregistry');
var ApplicationService = require('core/applicationservice');

var vueComponentOptions = {
  template: require('./catalog.html'),
  data: function() {
    return {
      prstate: ProjectsRegistry.state
    }
  },
  computed: {
    project: function() {
      return this.prstate.currentProject
    },
    title: function() {
      return this.project.state.title;
    },
    layerstree: function(){
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
    }
  },
  ready: function() {
    var self = this;

    this.$on('treenodetoogled',function(node){
      self.project.toggleLayer(node.id);
    });

    this.$on('treenodestoogled',function(nodes,parentChecked){
      var layersIds = _.map(nodes,'id');
      self.project.toggleLayers(layersIds,parentChecked);
    });
    
    this.$on('treenodeselected',function(node) {
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
    layerstree: [],
    //eredito il numero di childs dal parent
    n_parentChilds : 0,
    checked: false
  },
  data: function () {
    return {
      expanded: this.layerstree.expanded,
      parentChecked: false,
      //proprieta che serve per fare confronto per il tristate
      n_childs: this.layerstree.nodes ? this.layerstree.nodes.length : 0
    }
  },
  watch: {
      'checked': function (val){
        this.layerstree.visible = val;
      }
  },
  computed: {
    isFolder: function () {
      var isFolder = this.n_childs ? true : false;
      if (isFolder) {
        var _visibleChilds = 0;
        _.forEach(this.layerstree.nodes,function(layer){
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
    }

  },
  methods: {
    toggle: function (checkAllLayers) {
      var checkAll = checkAllLayers == 'true' ? true : false;
      if (this.isFolder && !checkAll) {
        this.layerstree.expanded = !this.layerstree.expanded;
      }
      else if (checkAll){
        if (this.parentChecked && !this.n_parentChilds){
          this.parentChecked = false;
        } else if (this.parentChecked && this.n_parentChilds) {
          this.parentChecked = true;
        }
        else {
          this.parentChecked = !this.parentChecked;
        }
        this.$dispatch('treenodestoogled',this.layerstree.nodes,this.parentChecked);
      }
      else {
        this.$dispatch('treenodetoogled',this.layerstree);
      }
    },
    select: function () {
      if (!this.isFolder) {
        this.$dispatch('treenodeselected',this.layerstree);
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
    isWfsCapabilities: function() {
      var mapControls = ApplicationService.getConfig().mapcontrols;
      return (mapControls.indexOf('querybbox') > -1 ) && (this.layerstree.wfscapabilities ? true: false);
    }
  }
});

Vue.component('legend',{
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
    ready: function() {
      //codice qui
    }
});

Vue.component('legend-item',{
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
  this.internalComponent = new InternalComponent;
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
